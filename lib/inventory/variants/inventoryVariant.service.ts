import { Prisma, type InventoryProductVariant } from "@prisma/client";

import {
  InventoryValidationError,
  isPrismaForeignKeyConstraintError,
  isPrismaRecordNotFoundError,
} from "../shared/inventoryErrors";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { findInventoryProductById } from "../products/inventoryProduct.repository";
import { normalizeInventoryProductId } from "../products/inventoryProduct.validators";

import {
  mapInventoryVariantDetail,
  mapInventoryVariants,
} from "./inventoryVariant.mapper";

import {
  countActiveInventoryProductVariants,
  createInventoryVariantRecord,
  deactivateInventoryVariantRecord,
  findActiveDefaultInventoryVariant,
  findAnotherActiveInventoryVariant,
  findInventoryVariantById,
  findInventoryVariantDetailById,
  findInventoryVariants,
  findInventoryVariantStockUnitById,
  getInventoryVariantStockTotals,
  updateInventoryVariantRecord,
} from "./inventoryVariant.repository";

import type {
  InventoryVariantDetailResponse,
  InventoryVariantResponse,
  InventoryVariantUpdateData,
} from "./inventoryVariant.types";

import {
  normalizeInventoryVariantCreateInput,
  normalizeInventoryVariantFilters,
  normalizeInventoryVariantId,
  normalizeInventoryVariantUpdateInput,
} from "./inventoryVariant.validators";

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
      message: "No se encontró la variante de inventario.",
    },
  };
}

function buildProductNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró el producto seleccionado.",
      errors: {
        inventory_product_id: "El producto indicado no existe.",
      },
    },
  };
}

function buildProductInactiveResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "El producto seleccionado está desactivado.",
      errors: {
        inventory_product_id:
          "Active el producto antes de agregar o reactivar variantes.",
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
      message: "La variante todavía tiene existencias o cantidades reservadas.",
      errors: {
        inventory:
          "Traslade o ajuste el inventario antes de realizar esta acción.",
      },
    },
  };
}

function buildLastActiveVariantResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "No se puede desactivar la única variante activa del producto.",
      errors: {
        is_active:
          "El producto activo debe conservar al menos una variante activa.",
      },
    },
  };
}

function buildCannotUnsetDefaultResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "No puede quitar directamente la condición predeterminada.",
      errors: {
        is_default:
          "Marque otra variante como predeterminada para realizar el cambio.",
      },
    },
  };
}

function buildInactiveDefaultResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "Una variante desactivada no puede ser predeterminada.",
      errors: {
        is_default: "Active la variante antes de marcarla como predeterminada.",
      },
    },
  };
}

function buildInvalidStockRangeResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 400,
    body: {
      success: false,
      message:
        "El inventario máximo no puede ser menor que el inventario mínimo.",
      errors: {
        maximum_stock: "Debe ser igual o mayor que el inventario mínimo.",
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
      message: "Ocurrió un error al procesar la variante de inventario.",
    },
  };
}

function hasNonZeroQuantity(value: Prisma.Decimal | null | undefined) {
  return value ? !value.isZero() : false;
}

async function variantHasStock(inventoryProductVariantId: string) {
  const totals = await getInventoryVariantStockTotals(
    inventoryProductVariantId,
  );

  return (
    hasNonZeroQuantity(totals._sum.quantity_on_hand) ||
    hasNonZeroQuantity(totals._sum.quantity_reserved)
  );
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

function hasValidStockRange(
  currentVariant: Pick<
    InventoryProductVariant,
    "minimum_stock" | "maximum_stock"
  >,
  data: InventoryVariantUpdateData,
) {
  const minimumStock = new Prisma.Decimal(
    data.minimum_stock ?? currentVariant.minimum_stock.toString(),
  );

  const maximumStock =
    data.maximum_stock !== undefined
      ? data.maximum_stock
      : (currentVariant.maximum_stock?.toString() ?? null);

  if (maximumStock === null) {
    return true;
  }

  return new Prisma.Decimal(maximumStock).greaterThanOrEqualTo(minimumStock);
}

async function getVariantDetail(
  inventoryProductVariantId: string,
): Promise<InventoryVariantDetailResponse | null> {
  const variant = await findInventoryVariantDetailById(
    inventoryProductVariantId,
  );

  return variant ? mapInventoryVariantDetail(variant) : null;
}

export async function getInventoryVariantsFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryVariantResponse[]>> {
  try {
    const filters = normalizeInventoryVariantFilters(searchParams);

    const variants = await findInventoryVariants(filters);

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryVariants(variants),
        message:
          variants.length === 0
            ? "No hay variantes de inventario configuradas."
            : undefined,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryVariantsFromSearchParams error:", error);

    return buildUnexpectedResponse();
  }
}

export async function getInventoryVariantById(
  id: unknown,
): Promise<InventoryServiceResult<InventoryVariantDetailResponse>> {
  try {
    const variantId = normalizeInventoryVariantId(id);

    const variant = await getVariantDetail(variantId);

    if (!variant) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: variant,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryVariantById error:", error);

    return buildUnexpectedResponse();
  }
}

export async function createInventoryVariant(
  productIdInput: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryVariantDetailResponse>> {
  try {
    const productId = normalizeInventoryProductId(productIdInput);

    const product = await findInventoryProductById(productId);

    if (!product) {
      return buildProductNotFoundResponse();
    }

    if (!product.is_active) {
      return buildProductInactiveResponse();
    }

    const data = normalizeInventoryVariantCreateInput(input);

    const unitError = await validateStockUnit(data.stock_unit_id);

    if (unitError) {
      return unitError;
    }

    const activeDefault = await findActiveDefaultInventoryVariant(
      product.inventory_product_id,
    );

    if (!activeDefault) {
      data.is_default = true;
    }

    const createdVariant = await createInventoryVariantRecord(
      product.inventory_product_id,
      data,
    );

    const variant = await getVariantDetail(
      createdVariant.inventory_product_variant_id,
    );

    if (!variant) {
      return buildUnexpectedResponse();
    }

    return {
      status: 201,
      body: {
        success: true,
        data: variant,
        message: "Variante de inventario creada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaForeignKeyConstraintError(error)) {
      return buildRelationUnavailableResponse();
    }

    console.error("createInventoryVariant error:", error);

    return buildUnexpectedResponse();
  }
}

export async function updateInventoryVariant(
  id: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryVariantDetailResponse>> {
  try {
    const variantId = normalizeInventoryVariantId(id);

    const data = normalizeInventoryVariantUpdateInput(input);

    const currentVariant = await findInventoryVariantById(variantId);

    if (!currentVariant) {
      return buildNotFoundResponse();
    }

    const product = await findInventoryProductById(
      currentVariant.inventory_product_id,
    );

    if (!product) {
      return buildProductNotFoundResponse();
    }

    const reactivatesVariant =
      data.is_active === true && !currentVariant.is_active;

    const deactivatesVariant =
      data.is_active === false && currentVariant.is_active;

    const nextIsActive = data.is_active ?? currentVariant.is_active;

    if (reactivatesVariant && !product.is_active) {
      return buildProductInactiveResponse();
    }

    if (data.stock_unit_id !== undefined || reactivatesVariant) {
      const nextStockUnitId =
        data.stock_unit_id ?? currentVariant.stock_unit_id;

      const unitError = await validateStockUnit(nextStockUnitId);

      if (unitError) {
        return unitError;
      }
    }

    if (data.is_default === true && !nextIsActive) {
      return buildInactiveDefaultResponse();
    }

    if (
      currentVariant.is_default &&
      data.is_default === false &&
      !deactivatesVariant
    ) {
      return buildCannotUnsetDefaultResponse();
    }

    if (!hasValidStockRange(currentVariant, data)) {
      return buildInvalidStockRangeResponse();
    }

    const changesStockUnit =
      data.stock_unit_id !== undefined &&
      data.stock_unit_id !== currentVariant.stock_unit_id;

    if (
      (deactivatesVariant || changesStockUnit) &&
      (await variantHasStock(variantId))
    ) {
      return buildStockExistsResponse();
    }

    if (deactivatesVariant) {
      const activeVariantCount = await countActiveInventoryProductVariants(
        currentVariant.inventory_product_id,
      );

      if (product.is_active && activeVariantCount <= 1) {
        return buildLastActiveVariantResponse();
      }

      const replacementVariant = currentVariant.is_default
        ? await findAnotherActiveInventoryVariant(
            currentVariant.inventory_product_id,
            variantId,
          )
        : null;

      await deactivateInventoryVariantRecord(
        variantId,
        currentVariant.inventory_product_id,
        data,
        replacementVariant?.inventory_product_variant_id ?? null,
      );
    } else {
      if (reactivatesVariant) {
        const activeDefault = await findActiveDefaultInventoryVariant(
          currentVariant.inventory_product_id,
        );

        if (!activeDefault) {
          data.is_default = true;
        }
      }

      await updateInventoryVariantRecord(
        variantId,
        currentVariant.inventory_product_id,
        data,
      );
    }

    const variant = await getVariantDetail(variantId);

    if (!variant) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: variant,
        message: "Variante de inventario actualizada correctamente.",
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

    console.error("updateInventoryVariant error:", error);

    return buildUnexpectedResponse();
  }
}

export async function deactivateInventoryVariant(
  id: unknown,
): Promise<InventoryServiceResult<InventoryVariantDetailResponse>> {
  try {
    const variantId = normalizeInventoryVariantId(id);

    const currentVariant = await findInventoryVariantById(variantId);

    if (!currentVariant) {
      return buildNotFoundResponse();
    }

    if (!currentVariant.is_active) {
      const variant = await getVariantDetail(variantId);

      if (!variant) {
        return buildNotFoundResponse();
      }

      return {
        status: 200,
        body: {
          success: true,
          data: variant,
          message: "La variante ya estaba desactivada.",
        },
      };
    }

    const product = await findInventoryProductById(
      currentVariant.inventory_product_id,
    );

    if (!product) {
      return buildProductNotFoundResponse();
    }

    if (await variantHasStock(variantId)) {
      return buildStockExistsResponse();
    }

    const activeVariantCount = await countActiveInventoryProductVariants(
      currentVariant.inventory_product_id,
    );

    if (product.is_active && activeVariantCount <= 1) {
      return buildLastActiveVariantResponse();
    }

    const replacementVariant = currentVariant.is_default
      ? await findAnotherActiveInventoryVariant(
          currentVariant.inventory_product_id,
          variantId,
        )
      : null;

    await deactivateInventoryVariantRecord(
      variantId,
      currentVariant.inventory_product_id,
      {},
      replacementVariant?.inventory_product_variant_id ?? null,
    );

    const variant = await getVariantDetail(variantId);

    if (!variant) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: variant,
        message: "Variante de inventario desactivada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    console.error("deactivateInventoryVariant error:", error);

    return buildUnexpectedResponse();
  }
}
