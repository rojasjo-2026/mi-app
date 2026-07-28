import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  normalizeCatalogSearch,
  normalizeCatalogUuid,
} from "../shared/inventoryCatalogValidation";

import type {
  InventoryStockBalanceFilters,
  InventoryStockBalanceQuery,
} from "./inventoryStockBalance.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function normalizeOptionalUuid(value: string | null, fieldLabel: string) {
  if (!value) {
    return undefined;
  }

  return normalizeCatalogUuid(value, fieldLabel);
}

function normalizeBooleanSearchParameter(
  searchParams: URLSearchParams,
  parameterName: string,
  defaultValue: boolean,
) {
  const rawValue = searchParams.get(parameterName);

  if (rawValue === null) {
    return defaultValue;
  }

  const cleanValue = rawValue.trim().toLowerCase();

  if (cleanValue === "true" || cleanValue === "1") {
    return true;
  }

  if (cleanValue === "false" || cleanValue === "0") {
    return false;
  }

  throw new InventoryValidationError(
    `El parámetro ${parameterName} no es válido.`,
    {
      errors: {
        [parameterName]: "Utilice true, false, 1 o 0.",
      },
    },
  );
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

function normalizeStockBalanceFilters(
  searchParams: URLSearchParams,
): InventoryStockBalanceFilters {
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

    search: normalizeCatalogSearch(searchParams.get("search")),

    onlyWithStock: normalizeBooleanSearchParameter(
      searchParams,
      "only_with_stock",
      false,
    ),

    includeInactive: normalizeBooleanSearchParameter(
      searchParams,
      "include_inactive",
      false,
    ),
  };
}

export function normalizeInventoryStockBalanceQuery(
  searchParams: URLSearchParams,
): InventoryStockBalanceQuery {
  return {
    filters: normalizeStockBalanceFilters(searchParams),

    page: normalizePositiveInteger(searchParams, "page", DEFAULT_PAGE),

    pageSize: normalizePositiveInteger(
      searchParams,
      "page_size",
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    ),
  };
}

export function normalizeInventoryStockBalanceId(value: unknown) {
  return normalizeCatalogUuid(value, "El id del balance de inventario");
}
