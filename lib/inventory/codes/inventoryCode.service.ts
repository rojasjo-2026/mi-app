import { Prisma } from "@prisma/client";

import {
  InventoryValidationError,
  isPrismaForeignKeyConstraintError,
  isPrismaRecordNotFoundError,
  isPrismaUniqueConstraintError,
} from "../shared/inventoryErrors";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { findInventoryProductById } from "../products/inventoryProduct.repository";

import {
  findInventoryVariantById,
  findInventoryVariantStockUnitById,
} from "../variants/inventoryVariant.repository";

import { normalizeInventoryVariantId } from "../variants/inventoryVariant.validators";

import { mapInventoryCode, mapInventoryCodes } from "./inventoryCode.mapper";

import {
  createInventoryCodeRecord,
  deactivateInventoryCodeRecord,
  findActivePrimaryInventoryCode,
  findAnotherActiveInventoryCode,
  findInventoryCodeById,
  findInventoryCodeByValue,
  findInventoryCodeDetailById,
  findInventoryCodes,
  findInventoryCodeUnitById,
  updateInventoryCodeRecord,
} from "./inventoryCode.repository";

import type {
  InventoryCodeResponse,
  InventoryCodeUpdateData,
} from "./inventoryCode.types";

import {
  normalizeInventoryCodeCreateInput,
  normalizeInventoryCodeFilters,
  normalizeInventoryCodeId,
  normalizeInventoryCodeUpdateInput,
} from "./inventoryCode.validators";

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
      message: "No se encontró el código de inventario.",
    },
  };
}

function buildVariantNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró la variante seleccionada.",
      errors: {
        inventory_product_variant_id: "La variante indicada no existe.",
      },
    },
  };
}

function buildVariantInactiveResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "La variante seleccionada está desactivada.",
      errors: {
        inventory_product_variant_id:
          "Active la variante antes de agregar o reactivar códigos.",
      },
    },
  };
}

function buildProductNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró el producto relacionado.",
    },
  };
}

function buildProductInactiveResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "El producto relacionado está desactivado.",
      errors: {
        inventory_product_variant_id:
          "Active el producto antes de agregar o reactivar códigos.",
      },
    },
  };
}

function buildUnitNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró la unidad de medida seleccionada.",
      errors: {
        unit_of_measure_id: "La unidad de medida indicada no existe.",
      },
    },
  };
}

function buildUnitInactiveResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "La unidad de medida seleccionada está desactivada.",
      errors: {
        unit_of_measure_id: "Debe seleccionar una unidad de medida activa.",
      },
    },
  };
}

function buildStockUnitUnavailableResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "La unidad de inventario de la variante no está disponible.",
    },
  };
}

function buildDuplicateCodeResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "Ya existe un código de inventario con ese valor.",
      errors: {
        code: "Ingrese un código diferente.",
      },
    },
  };
}

function buildInactivePrimaryResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "Un código desactivado no puede ser principal.",
      errors: {
        is_primary: "Active el código antes de marcarlo como principal.",
      },
    },
  };
}

function buildCannotUnsetPrimaryResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "No puede quitar directamente la condición de código principal.",
      errors: {
        is_primary:
          "Marque otro código como principal para realizar el cambio.",
      },
    },
  };
}

function buildInvalidQuantityResponse<T>(
  message: string,
): InventoryServiceResult<T> {
  return {
    status: 400,
    body: {
      success: false,
      message,
      errors: {
        quantity_in_stock_unit: message,
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
      message: "Ocurrió un error al procesar el código de inventario.",
    },
  };
}

async function getCodeDetail(
  inventoryProductCodeId: string,
): Promise<InventoryCodeResponse | null> {
  const code = await findInventoryCodeDetailById(inventoryProductCodeId);

  return code ? mapInventoryCode(code) : null;
}

async function validateOptionalUnit(
  unitOfMeasureId: string | null,
): Promise<InventoryServiceResult<never> | null> {
  if (!unitOfMeasureId) {
    return null;
  }

  const unit = await findInventoryCodeUnitById(unitOfMeasureId);

  if (!unit) {
    return buildUnitNotFoundResponse();
  }

  if (!unit.is_active) {
    return buildUnitInactiveResponse();
  }

  return null;
}

async function validateParentAvailability(
  inventoryProductVariantId: string,
): Promise<InventoryServiceResult<never> | null> {
  const variant = await findInventoryVariantById(inventoryProductVariantId);

  if (!variant) {
    return buildVariantNotFoundResponse();
  }

  if (!variant.is_active) {
    return buildVariantInactiveResponse();
  }

  const product = await findInventoryProductById(variant.inventory_product_id);

  if (!product) {
    return buildProductNotFoundResponse();
  }

  if (!product.is_active) {
    return buildProductInactiveResponse();
  }

  return null;
}

async function validateQuantityCompatibility(params: {
  inventoryProductVariantId: string;
  unitOfMeasureId: string | null;
  quantityInStockUnit: string;
}): Promise<InventoryServiceResult<never> | null> {
  const variant = await findInventoryVariantById(
    params.inventoryProductVariantId,
  );

  if (!variant) {
    return buildVariantNotFoundResponse();
  }

  const stockUnit = await findInventoryVariantStockUnitById(
    variant.stock_unit_id,
  );

  if (!stockUnit) {
    return buildStockUnitUnavailableResponse();
  }

  const quantity = new Prisma.Decimal(params.quantityInStockUnit);

  if (params.unitOfMeasureId === null && !quantity.equals(1)) {
    return buildInvalidQuantityResponse(
      "Cuando no se indica una unidad alternativa, la cantidad debe ser 1.",
    );
  }

  if (params.unitOfMeasureId === variant.stock_unit_id && !quantity.equals(1)) {
    return buildInvalidQuantityResponse(
      "Un código asociado directamente con la unidad de inventario debe representar una cantidad de 1.",
    );
  }

  if (!stockUnit.allows_decimal && !quantity.isInteger()) {
    return buildInvalidQuantityResponse(
      "La unidad de inventario no permite cantidades decimales.",
    );
  }

  if (quantity.decimalPlaces() > stockUnit.decimal_scale) {
    return buildInvalidQuantityResponse(
      `La cantidad no puede tener más de ${stockUnit.decimal_scale} decimales.`,
    );
  }

  return null;
}

async function validateUniqueCode(
  codeValue: string,
  excludedCodeId?: string,
): Promise<InventoryServiceResult<never> | null> {
  const existingCode = await findInventoryCodeByValue(codeValue);

  if (
    existingCode &&
    existingCode.inventory_product_code_id !== excludedCodeId
  ) {
    return buildDuplicateCodeResponse();
  }

  return null;
}

export async function getInventoryCodesFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryCodeResponse[]>> {
  try {
    const filters = normalizeInventoryCodeFilters(searchParams);

    const codes = await findInventoryCodes(filters);

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryCodes(codes),
        message:
          codes.length === 0
            ? "No hay códigos de inventario configurados."
            : undefined,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryCodesFromSearchParams error:", error);

    return buildUnexpectedResponse();
  }
}

export async function getInventoryCodeById(
  id: unknown,
): Promise<InventoryServiceResult<InventoryCodeResponse>> {
  try {
    const codeId = normalizeInventoryCodeId(id);

    const code = await getCodeDetail(codeId);

    if (!code) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: code,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryCodeById error:", error);

    return buildUnexpectedResponse();
  }
}

export async function createInventoryCode(
  variantIdInput: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryCodeResponse>> {
  try {
    const variantId = normalizeInventoryVariantId(variantIdInput);

    const parentError = await validateParentAvailability(variantId);

    if (parentError) {
      return parentError;
    }

    const data = normalizeInventoryCodeCreateInput(input);

    const duplicateError = await validateUniqueCode(data.code);

    if (duplicateError) {
      return duplicateError;
    }

    const unitError = await validateOptionalUnit(data.unit_of_measure_id);

    if (unitError) {
      return unitError;
    }

    const quantityError = await validateQuantityCompatibility({
      inventoryProductVariantId: variantId,
      unitOfMeasureId: data.unit_of_measure_id,
      quantityInStockUnit: data.quantity_in_stock_unit,
    });

    if (quantityError) {
      return quantityError;
    }

    const activePrimary = await findActivePrimaryInventoryCode(variantId);

    if (!activePrimary) {
      data.is_primary = true;
    }

    const createdCode = await createInventoryCodeRecord(variantId, data);

    const code = await getCodeDetail(createdCode.inventory_product_code_id);

    if (!code) {
      return buildUnexpectedResponse();
    }

    return {
      status: 201,
      body: {
        success: true,
        data: code,
        message: "Código de inventario creado correctamente.",
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
      return buildRelationUnavailableResponse();
    }

    console.error("createInventoryCode error:", error);

    return buildUnexpectedResponse();
  }
}

export async function updateInventoryCode(
  id: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryCodeResponse>> {
  try {
    const codeId = normalizeInventoryCodeId(id);

    const data = normalizeInventoryCodeUpdateInput(input);

    const currentCode = await findInventoryCodeById(codeId);

    if (!currentCode) {
      return buildNotFoundResponse();
    }

    const reactivatesCode = data.is_active === true && !currentCode.is_active;

    const deactivatesCode = data.is_active === false && currentCode.is_active;

    const nextIsActive = data.is_active ?? currentCode.is_active;

    if (reactivatesCode) {
      const parentError = await validateParentAvailability(
        currentCode.inventory_product_variant_id,
      );

      if (parentError) {
        return parentError;
      }
    }

    if (data.is_primary === true && !nextIsActive) {
      return buildInactivePrimaryResponse();
    }

    if (
      currentCode.is_primary &&
      data.is_primary === false &&
      !deactivatesCode
    ) {
      return buildCannotUnsetPrimaryResponse();
    }

    if (data.code !== undefined && data.code !== currentCode.code) {
      const duplicateError = await validateUniqueCode(data.code, codeId);

      if (duplicateError) {
        return duplicateError;
      }
    }

    const nextUnitOfMeasureId =
      data.unit_of_measure_id !== undefined
        ? data.unit_of_measure_id
        : currentCode.unit_of_measure_id;

    const nextQuantity =
      data.quantity_in_stock_unit ??
      currentCode.quantity_in_stock_unit.toString();

    if (
      data.unit_of_measure_id !== undefined ||
      data.quantity_in_stock_unit !== undefined ||
      reactivatesCode
    ) {
      const unitError = await validateOptionalUnit(nextUnitOfMeasureId);

      if (unitError) {
        return unitError;
      }

      const quantityError = await validateQuantityCompatibility({
        inventoryProductVariantId: currentCode.inventory_product_variant_id,
        unitOfMeasureId: nextUnitOfMeasureId,
        quantityInStockUnit: nextQuantity,
      });

      if (quantityError) {
        return quantityError;
      }
    }

    if (deactivatesCode) {
      const replacementCode = currentCode.is_primary
        ? await findAnotherActiveInventoryCode(
            currentCode.inventory_product_variant_id,
            codeId,
          )
        : null;

      await deactivateInventoryCodeRecord(
        codeId,
        currentCode.inventory_product_variant_id,
        data,
        replacementCode?.inventory_product_code_id ?? null,
      );
    } else {
      if (reactivatesCode) {
        const activePrimary = await findActivePrimaryInventoryCode(
          currentCode.inventory_product_variant_id,
        );

        if (!activePrimary) {
          data.is_primary = true;
        }
      }

      await updateInventoryCodeRecord(
        codeId,
        currentCode.inventory_product_variant_id,
        data,
      );
    }

    const code = await getCodeDetail(codeId);

    if (!code) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: code,
        message: "Código de inventario actualizado correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    if (isPrismaUniqueConstraintError(error)) {
      return buildDuplicateCodeResponse();
    }

    if (isPrismaForeignKeyConstraintError(error)) {
      return buildRelationUnavailableResponse();
    }

    console.error("updateInventoryCode error:", error);

    return buildUnexpectedResponse();
  }
}

export async function deactivateInventoryCode(
  id: unknown,
): Promise<InventoryServiceResult<InventoryCodeResponse>> {
  try {
    const codeId = normalizeInventoryCodeId(id);

    const currentCode = await findInventoryCodeById(codeId);

    if (!currentCode) {
      return buildNotFoundResponse();
    }

    if (!currentCode.is_active) {
      const code = await getCodeDetail(codeId);

      if (!code) {
        return buildNotFoundResponse();
      }

      return {
        status: 200,
        body: {
          success: true,
          data: code,
          message: "El código ya estaba desactivado.",
        },
      };
    }

    const replacementCode = currentCode.is_primary
      ? await findAnotherActiveInventoryCode(
          currentCode.inventory_product_variant_id,
          codeId,
        )
      : null;

    await deactivateInventoryCodeRecord(
      codeId,
      currentCode.inventory_product_variant_id,
      {},
      replacementCode?.inventory_product_code_id ?? null,
    );

    const code = await getCodeDetail(codeId);

    if (!code) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: code,
        message: "Código de inventario desactivado correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    console.error("deactivateInventoryCode error:", error);

    return buildUnexpectedResponse();
  }
}
