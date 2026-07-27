import {
  InventoryValidationError,
  isPrismaForeignKeyConstraintError,
  isPrismaRecordNotFoundError,
  isPrismaUniqueConstraintError,
} from "../shared/inventoryErrors";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { wouldCreateInventoryCategoryCycle } from "./inventoryCategoryHierarchy";

import {
  mapInventoryCategories,
  mapInventoryCategoryDetail,
} from "./inventoryCategory.mapper";

import {
  countActiveInventoryCategoryChildren,
  createInventoryCategoryRecord,
  deactivateInventoryCategoryRecord,
  findInventoryCategories,
  findInventoryCategoryByCode,
  findInventoryCategoryById,
  findInventoryCategoryDetailById,
  findInventoryCategoryParentLinkById,
  updateInventoryCategoryRecord,
} from "./inventoryCategory.repository";

import type {
  InventoryCategoryDetailResponse,
  InventoryCategoryResponse,
} from "./inventoryCategory.types";

import {
  normalizeInventoryCategoryCreateInput,
  normalizeInventoryCategoryFilters,
  normalizeInventoryCategoryId,
  normalizeInventoryCategoryUpdateInput,
} from "./inventoryCategory.validators";

function buildValidationResponse<T>(
  error: InventoryValidationError,
): InventoryServiceResult<T> {
  return {
    status: error.status,
    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró la categoría de inventario.",
    },
  };
}

function buildDuplicateCodeResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "Ya existe una categoría con ese código.",
      errors: {
        category_code: "El código ya está registrado.",
      },
    },
  };
}

function buildActiveChildrenResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message:
        "No se puede desactivar la categoría porque tiene categorías hijas activas.",
      errors: {
        is_active: "Primero debe desactivar o trasladar las categorías hijas.",
      },
    },
  };
}

function buildParentNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró la categoría padre seleccionada.",
      errors: {
        parent_category_id: "La categoría padre no existe.",
      },
    },
  };
}

function buildParentInactiveResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "La categoría padre seleccionada está desactivada.",
      errors: {
        parent_category_id: "Debe seleccionar una categoría padre activa.",
      },
    },
  };
}

function buildHierarchyCycleResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message:
        "La categoría padre seleccionada produciría un ciclo en la jerarquía.",
      errors: {
        parent_category_id:
          "Una categoría no puede depender de sí misma ni de una de sus categorías hijas.",
      },
    },
  };
}

function buildUnexpectedResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al procesar la categoría de inventario.",
    },
  };
}

async function validateParentAssignment(params: {
  categoryId?: string;
  parentCategoryId: string | null;
}): Promise<InventoryServiceResult<never> | null> {
  if (!params.parentCategoryId) {
    return null;
  }

  if (params.categoryId === params.parentCategoryId) {
    return buildHierarchyCycleResponse();
  }

  const parentCategory = await findInventoryCategoryParentLinkById(
    params.parentCategoryId,
  );

  if (!parentCategory) {
    return buildParentNotFoundResponse();
  }

  if (!parentCategory.is_active) {
    return buildParentInactiveResponse();
  }

  if (
    params.categoryId &&
    (await wouldCreateInventoryCategoryCycle(
      params.categoryId,
      params.parentCategoryId,
    ))
  ) {
    return buildHierarchyCycleResponse();
  }

  return null;
}

async function getCategoryDetail(
  categoryId: string,
): Promise<InventoryCategoryDetailResponse | null> {
  const category = await findInventoryCategoryDetailById(categoryId);

  return category ? mapInventoryCategoryDetail(category) : null;
}

export async function getInventoryCategoriesFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryCategoryResponse[]>> {
  try {
    const filters = normalizeInventoryCategoryFilters(searchParams);
    const categories = await findInventoryCategories(filters);

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryCategories(categories),
        message:
          categories.length === 0
            ? "No hay categorías de inventario configuradas."
            : undefined,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryCategoriesFromSearchParams error:", error);

    return buildUnexpectedResponse();
  }
}

export async function getInventoryCategoryById(
  id: unknown,
): Promise<InventoryServiceResult<InventoryCategoryDetailResponse>> {
  try {
    const categoryId = normalizeInventoryCategoryId(id);
    const category = await getCategoryDetail(categoryId);

    if (!category) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: category,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryCategoryById error:", error);
    return buildUnexpectedResponse();
  }
}

export async function createInventoryCategory(
  input: unknown,
): Promise<InventoryServiceResult<InventoryCategoryDetailResponse>> {
  try {
    const data = normalizeInventoryCategoryCreateInput(input);

    if (data.category_code) {
      const existingCategory = await findInventoryCategoryByCode(
        data.category_code,
      );

      if (existingCategory) {
        return buildDuplicateCodeResponse();
      }
    }

    const parentError = await validateParentAssignment({
      parentCategoryId: data.parent_category_id,
    });

    if (parentError) {
      return parentError;
    }

    const createdCategory = await createInventoryCategoryRecord(data);

    const category = await getCategoryDetail(
      createdCategory.inventory_category_id,
    );

    if (!category) {
      return buildUnexpectedResponse();
    }

    return {
      status: 201,
      body: {
        success: true,
        data: category,
        message: "Categoría de inventario creada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaUniqueConstraintError(error)) {
      return buildDuplicateCodeResponse();
    }

    if (isPrismaForeignKeyConstraintError(error)) {
      return buildParentNotFoundResponse();
    }

    console.error("createInventoryCategory error:", error);
    return buildUnexpectedResponse();
  }
}

export async function updateInventoryCategory(
  id: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryCategoryDetailResponse>> {
  try {
    const categoryId = normalizeInventoryCategoryId(id);
    const data = normalizeInventoryCategoryUpdateInput(input);

    const currentCategory = await findInventoryCategoryById(categoryId);

    if (!currentCategory) {
      return buildNotFoundResponse();
    }

    if (
      data.category_code &&
      data.category_code !== currentCategory.category_code
    ) {
      const existingCategory = await findInventoryCategoryByCode(
        data.category_code,
      );

      if (
        existingCategory &&
        existingCategory.inventory_category_id !== categoryId
      ) {
        return buildDuplicateCodeResponse();
      }
    }

    if (data.parent_category_id !== undefined) {
      const parentError = await validateParentAssignment({
        categoryId,
        parentCategoryId: data.parent_category_id,
      });

      if (parentError) {
        return parentError;
      }
    }

    if (data.is_active === true) {
      const nextParentCategoryId =
        data.parent_category_id !== undefined
          ? data.parent_category_id
          : currentCategory.parent_category_id;

      const parentError = await validateParentAssignment({
        categoryId,
        parentCategoryId: nextParentCategoryId,
      });

      if (parentError) {
        return parentError;
      }
    }

    if (data.is_active === false && currentCategory.is_active) {
      const activeChildrenCount =
        await countActiveInventoryCategoryChildren(categoryId);

      if (activeChildrenCount > 0) {
        return buildActiveChildrenResponse();
      }
    }

    await updateInventoryCategoryRecord(categoryId, data);

    const category = await getCategoryDetail(categoryId);

    if (!category) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: category,
        message: "Categoría de inventario actualizada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaUniqueConstraintError(error)) {
      return buildDuplicateCodeResponse();
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    if (isPrismaForeignKeyConstraintError(error)) {
      return buildParentNotFoundResponse();
    }

    console.error("updateInventoryCategory error:", error);
    return buildUnexpectedResponse();
  }
}

export async function deactivateInventoryCategory(
  id: unknown,
): Promise<InventoryServiceResult<InventoryCategoryDetailResponse>> {
  try {
    const categoryId = normalizeInventoryCategoryId(id);

    const currentCategory = await findInventoryCategoryById(categoryId);

    if (!currentCategory) {
      return buildNotFoundResponse();
    }

    if (!currentCategory.is_active) {
      const category = await getCategoryDetail(categoryId);

      if (!category) {
        return buildNotFoundResponse();
      }

      return {
        status: 200,
        body: {
          success: true,
          data: category,
          message: "La categoría ya estaba desactivada.",
        },
      };
    }

    const activeChildrenCount =
      await countActiveInventoryCategoryChildren(categoryId);

    if (activeChildrenCount > 0) {
      return buildActiveChildrenResponse();
    }

    await deactivateInventoryCategoryRecord(categoryId);

    const category = await getCategoryDetail(categoryId);

    if (!category) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: category,
        message: "Categoría de inventario desactivada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    console.error("deactivateInventoryCategory error:", error);
    return buildUnexpectedResponse();
  }
}
