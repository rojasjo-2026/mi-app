import type {
  InventoryProduct,
  InventoryTrackingMode,
  Prisma,
} from "@prisma/client";

import {
  InventoryValidationError,
  isPrismaForeignKeyConstraintError,
  isPrismaRecordNotFoundError,
} from "../shared/inventoryErrors";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import {
  countActiveInventoryProductVariants,
  findInventoryVariantStockUnitById,
} from "../variants/inventoryVariant.repository";

import { reactivateInventoryProductWithFallbackVariant } from "./inventoryProductActivation.repository";

import {
  mapInventoryProductDetail,
  mapInventoryProducts,
} from "./inventoryProduct.mapper";

import {
  createInventoryProductRecord,
  deactivateInventoryProductRecord,
  findInventoryProductById,
  findInventoryProductCategoryById,
  findInventoryProductDetailById,
  findInventoryProducts,
  getInventoryProductStockTotals,
  updateInventoryProductRecord,
} from "./inventoryProduct.repository";

import type {
  InventoryProductDetailResponse,
  InventoryProductResponse,
  InventoryProductUpdateData,
} from "./inventoryProduct.types";

import {
  normalizeInventoryProductCreateInput,
  normalizeInventoryProductFilters,
  normalizeInventoryProductId,
  normalizeInventoryProductUpdateInput,
  validateInventoryProductBusinessRules,
} from "./inventoryProduct.validators";

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
      message: "No se encontró el producto de inventario.",
    },
  };
}

function buildCategoryNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró la categoría seleccionada.",
      errors: {
        inventory_category_id: "La categoría indicada no existe.",
      },
    },
  };
}

function buildCategoryInactiveResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "La categoría seleccionada está desactivada.",
      errors: {
        inventory_category_id: "Debe seleccionar una categoría activa.",
      },
    },
  };
}

function buildUnitNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró la unidad de inventario seleccionada.",
      errors: {
        stock_unit_id: "La unidad de inventario indicada no existe.",
      },
    },
  };
}

function buildUnitInactiveResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "La unidad de inventario seleccionada está desactivada.",
      errors: {
        stock_unit_id: "Debe seleccionar una unidad de inventario activa.",
      },
    },
  };
}

function buildStockExistsResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "El producto todavía tiene existencias o cantidades reservadas.",
      errors: {
        inventory:
          "Traslade o ajuste el inventario antes de realizar esta acción.",
      },
    },
  };
}

function buildNoActiveVariantResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message:
        "El producto no tiene una variante disponible para reactivación.",
      errors: {
        is_active:
          "Debe existir al menos una variante con una unidad de inventario activa.",
      },
    },
  };
}

function buildRelationUnavailableResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "Una de las relaciones seleccionadas ya no está disponible.",
    },
  };
}

function buildUnexpectedResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al procesar el producto de inventario.",
    },
  };
}

function hasNonZeroQuantity(value: Prisma.Decimal | null | undefined) {
  return value ? !value.isZero() : false;
}

async function productHasStock(inventoryProductId: string) {
  const totals = await getInventoryProductStockTotals(inventoryProductId);

  return (
    hasNonZeroQuantity(totals._sum.quantity_on_hand) ||
    hasNonZeroQuantity(totals._sum.quantity_reserved)
  );
}

async function validateCategoryAssignment(
  inventoryCategoryId: string | null,
): Promise<InventoryServiceResult<never> | null> {
  if (!inventoryCategoryId) {
    return null;
  }

  const category = await findInventoryProductCategoryById(inventoryCategoryId);

  if (!category) {
    return buildCategoryNotFoundResponse();
  }

  if (!category.is_active) {
    return buildCategoryInactiveResponse();
  }

  return null;
}

async function validateStockUnit(
  stockUnitId: string,
): Promise<InventoryServiceResult<never> | null> {
  const unit = await findInventoryVariantStockUnitById(stockUnitId);

  if (!unit) {
    return buildUnitNotFoundResponse();
  }

  if (!unit.is_active) {
    return buildUnitInactiveResponse();
  }

  return null;
}

async function getProductDetail(
  inventoryProductId: string,
): Promise<InventoryProductDetailResponse | null> {
  const product = await findInventoryProductDetailById(inventoryProductId);

  return product ? mapInventoryProductDetail(product) : null;
}

function validateUpdatedProductRules(
  currentProduct: InventoryProduct,
  data: InventoryProductUpdateData,
) {
  const managesStock = data.manages_stock ?? currentProduct.manages_stock;

  const trackingMode = data.tracking_mode ?? currentProduct.tracking_mode;

  const allowNegativeStock =
    data.allow_negative_stock ?? currentProduct.allow_negative_stock;

  const taxExempt = data.tax_exempt ?? currentProduct.tax_exempt;

  const taxRate =
    data.tax_rate !== undefined
      ? data.tax_rate
      : (currentProduct.tax_rate?.toString() ?? null);

  validateInventoryProductBusinessRules({
    managesStock,
    trackingMode,
    allowNegativeStock,
    taxExempt,
    taxRate,
  });
}

function changesTrackingMode(
  currentTrackingMode: InventoryTrackingMode,
  data: InventoryProductUpdateData,
) {
  return (
    data.tracking_mode !== undefined &&
    data.tracking_mode !== currentTrackingMode
  );
}

export async function getInventoryProductsFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryProductResponse[]>> {
  try {
    const filters = normalizeInventoryProductFilters(searchParams);

    const products = await findInventoryProducts(filters);

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryProducts(products),
        message:
          products.length === 0
            ? "No hay productos de inventario configurados."
            : undefined,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryProductsFromSearchParams error:", error);

    return buildUnexpectedResponse();
  }
}

export async function getInventoryProductById(
  id: unknown,
): Promise<InventoryServiceResult<InventoryProductDetailResponse>> {
  try {
    const productId = normalizeInventoryProductId(id);

    const product = await getProductDetail(productId);

    if (!product) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: product,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryProductById error:", error);

    return buildUnexpectedResponse();
  }
}

export async function createInventoryProduct(
  input: unknown,
): Promise<InventoryServiceResult<InventoryProductDetailResponse>> {
  try {
    const data = normalizeInventoryProductCreateInput(input);

    const categoryError = await validateCategoryAssignment(
      data.inventory_category_id,
    );

    if (categoryError) {
      return categoryError;
    }

    const unitError = await validateStockUnit(
      data.default_variant.stock_unit_id,
    );

    if (unitError) {
      return unitError;
    }

    const createdProduct = await createInventoryProductRecord(data);

    const product = await getProductDetail(createdProduct.inventory_product_id);

    if (!product) {
      return buildUnexpectedResponse();
    }

    return {
      status: 201,
      body: {
        success: true,
        data: product,
        message: "Producto de inventario creado correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaForeignKeyConstraintError(error)) {
      return buildRelationUnavailableResponse();
    }

    console.error("createInventoryProduct error:", error);

    return buildUnexpectedResponse();
  }
}

export async function updateInventoryProduct(
  id: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryProductDetailResponse>> {
  try {
    const productId = normalizeInventoryProductId(id);

    const data = normalizeInventoryProductUpdateInput(input);

    const currentProduct = await findInventoryProductById(productId);

    if (!currentProduct) {
      return buildNotFoundResponse();
    }

    validateUpdatedProductRules(currentProduct, data);

    const reactivatesProduct =
      data.is_active === true && !currentProduct.is_active;

    if (data.inventory_category_id !== undefined || reactivatesProduct) {
      const nextCategoryId =
        data.inventory_category_id !== undefined
          ? data.inventory_category_id
          : currentProduct.inventory_category_id;

      const categoryError = await validateCategoryAssignment(nextCategoryId);

      if (categoryError) {
        return categoryError;
      }
    }

    let requiresVariantReactivation = false;

    if (reactivatesProduct) {
      const activeVariants =
        await countActiveInventoryProductVariants(productId);

      requiresVariantReactivation = activeVariants === 0;
    }

    const deactivatesProduct =
      data.is_active === false && currentProduct.is_active;

    const removesStockManagement =
      data.manages_stock === false && currentProduct.manages_stock;

    const changesTracking = changesTrackingMode(
      currentProduct.tracking_mode,
      data,
    );

    if (
      (deactivatesProduct || removesStockManagement || changesTracking) &&
      (await productHasStock(productId))
    ) {
      return buildStockExistsResponse();
    }

    if (requiresVariantReactivation) {
      const reactivatedVariant =
        await reactivateInventoryProductWithFallbackVariant(productId, data);

      if (!reactivatedVariant) {
        return buildNoActiveVariantResponse();
      }
    } else {
      await updateInventoryProductRecord(productId, data);
    }

    const product = await getProductDetail(productId);

    if (!product) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: product,
        message: "Producto de inventario actualizado correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    if (isPrismaForeignKeyConstraintError(error)) {
      return buildRelationUnavailableResponse();
    }

    console.error("updateInventoryProduct error:", error);

    return buildUnexpectedResponse();
  }
}

export async function deactivateInventoryProduct(
  id: unknown,
): Promise<InventoryServiceResult<InventoryProductDetailResponse>> {
  try {
    const productId = normalizeInventoryProductId(id);

    const currentProduct = await findInventoryProductById(productId);

    if (!currentProduct) {
      return buildNotFoundResponse();
    }

    if (!currentProduct.is_active) {
      const product = await getProductDetail(productId);

      if (!product) {
        return buildNotFoundResponse();
      }

      return {
        status: 200,
        body: {
          success: true,
          data: product,
          message: "El producto ya estaba desactivado.",
        },
      };
    }

    if (await productHasStock(productId)) {
      return buildStockExistsResponse();
    }

    await deactivateInventoryProductRecord(productId);

    const product = await getProductDetail(productId);

    if (!product) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: product,
        message: "Producto de inventario desactivado correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    console.error("deactivateInventoryProduct error:", error);

    return buildUnexpectedResponse();
  }
}
