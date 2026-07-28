import { InventoryMovementType } from "@prisma/client";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  normalizeCatalogEnum,
  normalizeCatalogSearch,
  normalizeCatalogUuid,
} from "../shared/inventoryCatalogValidation";

import type {
  InventoryMovementFilters,
  InventoryMovementQuery,
} from "./inventoryMovement.types";

const MOVEMENT_TYPES = Object.values(InventoryMovementType);

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function normalizeMovementType(value: unknown) {
  return normalizeCatalogEnum(value, "El tipo de movimiento", MOVEMENT_TYPES);
}

function normalizeOptionalUuid(value: string | null, fieldLabel: string) {
  if (!value) {
    return undefined;
  }

  return normalizeCatalogUuid(value, fieldLabel);
}

function normalizeDateValue(value: unknown, fieldLabel: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new InventoryValidationError(`${fieldLabel} no es válida.`);
    }

    return value;
  }

  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    throw new InventoryValidationError(`${fieldLabel} es requerida.`);
  }

  const date = new Date(cleanValue);

  if (Number.isNaN(date.getTime())) {
    throw new InventoryValidationError(`${fieldLabel} no es válida.`);
  }

  return date;
}

function normalizeOptionalDate(
  value: string | null,
  fieldLabel: string,
  endOfDay = false,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);

  const normalizedValue = isDateOnly
    ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : value;

  return normalizeDateValue(normalizedValue, fieldLabel);
}

function normalizePositiveInteger(
  searchParams: URLSearchParams,
  parameterName: string,
  defaultValue: number,
  maximumValue?: number,
) {
  const rawValue = searchParams.get(parameterName);

  if (rawValue === null) {
    return defaultValue;
  }

  const cleanValue = rawValue.trim();

  if (!/^\d+$/.test(cleanValue)) {
    throw new InventoryValidationError(
      `El parámetro ${parameterName} no es válido.`,
      {
        errors: {
          [parameterName]: "Ingrese un número entero positivo.",
        },
      },
    );
  }

  const parsedValue = Number(cleanValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    throw new InventoryValidationError(
      `El parámetro ${parameterName} no es válido.`,
      {
        errors: {
          [parameterName]: "Ingrese un número entero mayor o igual a 1.",
        },
      },
    );
  }

  if (maximumValue !== undefined && parsedValue > maximumValue) {
    throw new InventoryValidationError(
      `El parámetro ${parameterName} supera el máximo permitido.`,
      {
        errors: {
          [parameterName]: `El valor máximo permitido es ${maximumValue}.`,
        },
      },
    );
  }

  return parsedValue;
}

function normalizeMovementFilters(
  searchParams: URLSearchParams,
): InventoryMovementFilters {
  const rawMovementType = searchParams.get("movement_type");

  const dateFrom = normalizeOptionalDate(
    searchParams.get("date_from"),
    "La fecha inicial",
  );

  const dateTo = normalizeOptionalDate(
    searchParams.get("date_to"),
    "La fecha final",
    true,
  );

  if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
    throw new InventoryValidationError(
      "La fecha inicial no puede ser posterior a la fecha final.",
      {
        errors: {
          date_from: "Revise la fecha inicial.",
          date_to: "Revise la fecha final.",
        },
      },
    );
  }

  return {
    inventoryLocationId: normalizeOptionalUuid(
      searchParams.get("inventory_location_id"),
      "El id de la ubicación",
    ),

    inventoryProductVariantId: normalizeOptionalUuid(
      searchParams.get("inventory_product_variant_id"),
      "El id de la variante",
    ),

    inventoryProductId: normalizeOptionalUuid(
      searchParams.get("inventory_product_id"),
      "El id del producto",
    ),

    inventoryDocumentId: normalizeOptionalUuid(
      searchParams.get("inventory_document_id"),
      "El id del documento",
    ),

    movementType: rawMovementType
      ? normalizeMovementType(rawMovementType)
      : undefined,

    dateFrom,
    dateTo,

    search: normalizeCatalogSearch(searchParams.get("search")),
  };
}

export function normalizeInventoryMovementQuery(
  searchParams: URLSearchParams,
): InventoryMovementQuery {
  return {
    filters: normalizeMovementFilters(searchParams),

    page: normalizePositiveInteger(searchParams, "page", DEFAULT_PAGE),

    pageSize: normalizePositiveInteger(
      searchParams,
      "page_size",
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    ),
  };
}

export function normalizeInventoryMovementId(value: unknown) {
  return normalizeCatalogUuid(value, "El id del movimiento");
}
