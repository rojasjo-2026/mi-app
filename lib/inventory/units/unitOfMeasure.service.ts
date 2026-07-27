import {
  InventoryValidationError,
  isPrismaRecordNotFoundError,
  isPrismaUniqueConstraintError,
} from "../shared/inventoryErrors";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import {
  createUnitOfMeasureRecord,
  deactivateUnitOfMeasureRecord,
  findUnitOfMeasureByCode,
  findUnitOfMeasureById,
  findUnitOfMeasures,
  updateUnitOfMeasureRecord,
} from "./unitOfMeasure.repository";

import { mapUnitOfMeasure, mapUnitOfMeasures } from "./unitOfMeasure.mapper";

import type {
  UnitOfMeasureResponse,
  UnitOfMeasureUpdateData,
} from "./unitOfMeasure.types";

import {
  normalizeUnitOfMeasureCreateInput,
  normalizeUnitOfMeasureFilters,
  normalizeUnitOfMeasureId,
  normalizeUnitOfMeasureUpdateInput,
} from "./unitOfMeasure.validators";

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
      message: "No se encontró la unidad de medida.",
    },
  };
}

function buildDuplicateCodeResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "Ya existe una unidad de medida con ese código.",
      errors: {
        code: "El código ya está registrado.",
      },
    },
  };
}

function buildUnexpectedResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al procesar la unidad de medida.",
    },
  };
}

export async function getUnitOfMeasuresFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<UnitOfMeasureResponse[]>> {
  try {
    const filters = normalizeUnitOfMeasureFilters(searchParams);
    const units = await findUnitOfMeasures(filters);

    return {
      status: 200,
      body: {
        success: true,
        data: mapUnitOfMeasures(units),
        message:
          units.length === 0
            ? "No hay unidades de medida configuradas."
            : undefined,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getUnitOfMeasuresFromSearchParams error:", error);
    return buildUnexpectedResponse();
  }
}

export async function getUnitOfMeasureById(
  id: unknown,
): Promise<InventoryServiceResult<UnitOfMeasureResponse>> {
  try {
    const unitId = normalizeUnitOfMeasureId(id);
    const unit = await findUnitOfMeasureById(unitId);

    if (!unit) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: mapUnitOfMeasure(unit),
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getUnitOfMeasureById error:", error);
    return buildUnexpectedResponse();
  }
}

export async function createUnitOfMeasure(
  input: unknown,
): Promise<InventoryServiceResult<UnitOfMeasureResponse>> {
  try {
    const data = normalizeUnitOfMeasureCreateInput(input);
    const existingUnit = await findUnitOfMeasureByCode(data.code);

    if (existingUnit) {
      return buildDuplicateCodeResponse();
    }

    const createdUnit = await createUnitOfMeasureRecord(data);

    return {
      status: 201,
      body: {
        success: true,
        data: mapUnitOfMeasure(createdUnit),
        message: "Unidad de medida creada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaUniqueConstraintError(error)) {
      return buildDuplicateCodeResponse();
    }

    console.error("createUnitOfMeasure error:", error);
    return buildUnexpectedResponse();
  }
}

function applyDecimalRules(
  currentAllowsDecimal: boolean,
  data: UnitOfMeasureUpdateData,
): UnitOfMeasureUpdateData {
  const nextData = { ...data };
  const nextAllowsDecimal = nextData.allows_decimal ?? currentAllowsDecimal;

  if (!nextAllowsDecimal) {
    nextData.decimal_scale = 0;
    return nextData;
  }

  if (
    nextData.allows_decimal === true &&
    currentAllowsDecimal === false &&
    nextData.decimal_scale === undefined
  ) {
    nextData.decimal_scale = 2;
  }

  return nextData;
}

export async function updateUnitOfMeasure(
  id: unknown,
  input: unknown,
): Promise<InventoryServiceResult<UnitOfMeasureResponse>> {
  try {
    const unitId = normalizeUnitOfMeasureId(id);
    const requestedData = normalizeUnitOfMeasureUpdateInput(input);
    const currentUnit = await findUnitOfMeasureById(unitId);

    if (!currentUnit) {
      return buildNotFoundResponse();
    }

    if (requestedData.code && requestedData.code !== currentUnit.code) {
      const existingUnit = await findUnitOfMeasureByCode(requestedData.code);

      if (existingUnit && existingUnit.unit_of_measure_id !== unitId) {
        return buildDuplicateCodeResponse();
      }
    }

    const data = applyDecimalRules(currentUnit.allows_decimal, requestedData);

    const updatedUnit = await updateUnitOfMeasureRecord(unitId, data);

    return {
      status: 200,
      body: {
        success: true,
        data: mapUnitOfMeasure(updatedUnit),
        message: "Unidad de medida actualizada correctamente.",
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

    console.error("updateUnitOfMeasure error:", error);
    return buildUnexpectedResponse();
  }
}

export async function deactivateUnitOfMeasure(
  id: unknown,
): Promise<InventoryServiceResult<UnitOfMeasureResponse>> {
  try {
    const unitId = normalizeUnitOfMeasureId(id);
    const currentUnit = await findUnitOfMeasureById(unitId);

    if (!currentUnit) {
      return buildNotFoundResponse();
    }

    if (!currentUnit.is_active) {
      return {
        status: 200,
        body: {
          success: true,
          data: mapUnitOfMeasure(currentUnit),
          message: "La unidad de medida ya estaba desactivada.",
        },
      };
    }

    const updatedUnit = await deactivateUnitOfMeasureRecord(unitId);

    return {
      status: 200,
      body: {
        success: true,
        data: mapUnitOfMeasure(updatedUnit),
        message: "Unidad de medida desactivada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    console.error("deactivateUnitOfMeasure error:", error);
    return buildUnexpectedResponse();
  }
}
