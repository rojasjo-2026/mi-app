import { InventoryReservationStatus } from "@prisma/client";

import {
  normalizeCatalogSearch,
  normalizeCatalogUuid,
} from "../shared/inventoryCatalogValidation";

import { InventoryValidationError } from "../shared/inventoryErrors";

import type {
  InventoryReservationExpirationFilter,
  InventoryReservationQuery,
  InventoryReservationQueryFilters,
  InventoryReservationSortBy,
  InventoryReservationSortDirection,
} from "./inventoryReservationQuery.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const DEFAULT_EXPIRING_WITHIN_DAYS = 7;
const MAX_EXPIRING_WITHIN_DAYS = 365;
const MAX_REFERENCE_TYPE_LENGTH = 80;
const MAX_REFERENCE_ID_LENGTH = 160;

const RESERVATION_STATUSES = Object.values(InventoryReservationStatus);

const EXPIRATION_FILTERS: InventoryReservationExpirationFilter[] = [
  "ANY",
  "WITHOUT_DATE",
  "UPCOMING",
  "OVERDUE",
];

const SORT_FIELDS: InventoryReservationSortBy[] = [
  "reservation_number",
  "status",
  "expires_at",
  "created_at",
  "updated_at",
];

const SORT_DIRECTIONS: InventoryReservationSortDirection[] = ["asc", "desc"];

function normalizeOptionalUuid(value: string | null, fieldLabel: string) {
  if (!value) {
    return undefined;
  }

  return normalizeCatalogUuid(value, fieldLabel);
}

function normalizeOptionalText(
  value: string | null,
  parameterName: string,
  maximumLength: number,
) {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return undefined;
  }

  if (cleanValue.length > maximumLength) {
    throw new InventoryValidationError(
      `El parametro ${parameterName} supera el largo permitido.`,
      {
        errors: {
          [parameterName]: `Utilice un maximo de ${maximumLength} caracteres.`,
        },
      },
    );
  }

  return cleanValue;
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
      `El parametro ${parameterName} no es valido.`,
      {
        errors: {
          [parameterName]: "Ingrese un numero entero positivo.",
        },
      },
    );
  }

  const parsedValue = Number(cleanValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    throw new InventoryValidationError(
      `El parametro ${parameterName} no es valido.`,
      {
        errors: {
          [parameterName]: "Ingrese un numero entero mayor o igual a 1.",
        },
      },
    );
  }

  if (maximumValue !== undefined && parsedValue > maximumValue) {
    throw new InventoryValidationError(
      `El parametro ${parameterName} supera el maximo permitido.`,
      {
        errors: {
          [parameterName]: `El valor maximo permitido es ${maximumValue}.`,
        },
      },
    );
  }

  return parsedValue;
}

function normalizeOptionalDate(
  value: string | null,
  parameterName: string,
  endOfDay = false,
) {
  if (!value) {
    return undefined;
  }

  const cleanValue = value.trim();

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(cleanValue);

  const normalizedValue = isDateOnly
    ? `${cleanValue}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : cleanValue;

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    throw new InventoryValidationError(
      `El parametro ${parameterName} no contiene una fecha valida.`,
      {
        errors: {
          [parameterName]: "Utilice una fecha ISO valida.",
        },
      },
    );
  }

  return date;
}

function validateDateRange(
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  fromParameter: string,
  toParameter: string,
) {
  if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
    throw new InventoryValidationError(
      `El parametro ${fromParameter} no puede ser posterior a ${toParameter}.`,
      {
        errors: {
          [fromParameter]:
            "La fecha inicial debe ser anterior o igual a la fecha final.",
        },
      },
    );
  }
}

function normalizeStatuses(
  searchParams: URLSearchParams,
): InventoryReservationStatus[] {
  const rawValues = searchParams
    .getAll("status")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  if (rawValues.length === 0) {
    return [];
  }

  const invalidStatus = rawValues.find(
    (value) =>
      !RESERVATION_STATUSES.includes(value as InventoryReservationStatus),
  );

  if (invalidStatus) {
    throw new InventoryValidationError("El estado de reserva no es valido.", {
      errors: {
        status: `Estado no soportado: ${invalidStatus}.`,
      },
    });
  }

  return Array.from(new Set(rawValues)) as InventoryReservationStatus[];
}

function normalizeExpirationFilter(
  value: string | null,
): InventoryReservationExpirationFilter {
  if (!value) {
    return "ANY";
  }

  const normalizedValue = value
    .trim()
    .toUpperCase() as InventoryReservationExpirationFilter;

  if (!EXPIRATION_FILTERS.includes(normalizedValue)) {
    throw new InventoryValidationError(
      "El filtro expiration_status no es valido.",
      {
        errors: {
          expiration_status: "Utilice ANY, WITHOUT_DATE, UPCOMING u OVERDUE.",
        },
      },
    );
  }

  return normalizedValue;
}

function normalizeSortBy(value: string | null): InventoryReservationSortBy {
  if (!value) {
    return "created_at";
  }

  const normalizedValue = value
    .trim()
    .toLowerCase() as InventoryReservationSortBy;

  if (!SORT_FIELDS.includes(normalizedValue)) {
    throw new InventoryValidationError(
      "El campo de ordenamiento no es valido.",
      {
        errors: {
          sort_by: `Utilice uno de estos valores: ${SORT_FIELDS.join(", ")}.`,
        },
      },
    );
  }

  return normalizedValue;
}

function normalizeSortDirection(
  value: string | null,
): InventoryReservationSortDirection {
  if (!value) {
    return "desc";
  }

  const normalizedValue = value
    .trim()
    .toLowerCase() as InventoryReservationSortDirection;

  if (!SORT_DIRECTIONS.includes(normalizedValue)) {
    throw new InventoryValidationError(
      "La direccion de ordenamiento no es valida.",
      {
        errors: {
          sort_direction: "Utilice asc o desc.",
        },
      },
    );
  }

  return normalizedValue;
}

function normalizeFilters(
  searchParams: URLSearchParams,
): InventoryReservationQueryFilters {
  const createdFrom = normalizeOptionalDate(
    searchParams.get("created_from"),
    "created_from",
  );

  const createdTo = normalizeOptionalDate(
    searchParams.get("created_to"),
    "created_to",
    true,
  );

  const expiresFrom = normalizeOptionalDate(
    searchParams.get("expires_from"),
    "expires_from",
  );

  const expiresTo = normalizeOptionalDate(
    searchParams.get("expires_to"),
    "expires_to",
    true,
  );

  validateDateRange(createdFrom, createdTo, "created_from", "created_to");

  validateDateRange(expiresFrom, expiresTo, "expires_from", "expires_to");

  return {
    statuses: normalizeStatuses(searchParams),

    inventoryLocationId: normalizeOptionalUuid(
      searchParams.get("inventory_location_id"),
      "El id de la ubicacion",
    ),

    inventoryProductVariantId: normalizeOptionalUuid(
      searchParams.get("inventory_product_variant_id"),
      "El id de la variante",
    ),

    inventoryProductId: normalizeOptionalUuid(
      searchParams.get("inventory_product_id"),
      "El id del producto",
    ),

    referenceType: normalizeOptionalText(
      searchParams.get("reference_type"),
      "reference_type",
      MAX_REFERENCE_TYPE_LENGTH,
    ),

    referenceId: normalizeOptionalText(
      searchParams.get("reference_id"),
      "reference_id",
      MAX_REFERENCE_ID_LENGTH,
    ),

    search: normalizeCatalogSearch(searchParams.get("search")),

    createdFrom,
    createdTo,
    expiresFrom,
    expiresTo,

    expirationFilter: normalizeExpirationFilter(
      searchParams.get("expiration_status"),
    ),
  };
}

export function normalizeInventoryReservationQuery(
  searchParams: URLSearchParams,
): InventoryReservationQuery {
  return {
    filters: normalizeFilters(searchParams),

    page: normalizePositiveInteger(searchParams, "page", DEFAULT_PAGE),

    pageSize: normalizePositiveInteger(
      searchParams,
      "page_size",
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    ),

    sortBy: normalizeSortBy(searchParams.get("sort_by")),

    sortDirection: normalizeSortDirection(searchParams.get("sort_direction")),

    expiringWithinDays: normalizePositiveInteger(
      searchParams,
      "expiring_within_days",
      DEFAULT_EXPIRING_WITHIN_DAYS,
      MAX_EXPIRING_WITHIN_DAYS,
    ),

    asOf: new Date(),
  };
}

export function normalizeInventoryReservationQueryId(value: unknown) {
  return normalizeCatalogUuid(value, "El id de la reserva");
}
