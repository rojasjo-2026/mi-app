import { InventoryLocationType, type Prisma } from "@prisma/client";

import { InventoryValidationError } from "../shared/inventoryErrors";

import type {
  InventoryLocationCreateData,
  InventoryLocationFilters,
  InventoryLocationUpdateData,
} from "./inventoryLocation.types";

const MAX_CODE_LENGTH = 40;
const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_ADDRESS_LENGTH = 300;
const MAX_REFERENCE_LENGTH = 300;
const MAX_SEARCH_LENGTH = 100;
const MAX_SORT_ORDER = 1_000_000;
const MAX_METADATA_LENGTH = 20_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

const LOCATION_TYPES = new Set<string>(Object.values(InventoryLocationType));

function normalizeInputRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new InventoryValidationError(
      "El cuerpo de la solicitud no es válido.",
    );
  }

  return input as Record<string, unknown>;
}

function normalizeRequiredText(
  value: unknown,
  fieldLabel: string,
  maxLength: number,
) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    throw new InventoryValidationError(`${fieldLabel} es requerido.`);
  }

  if (cleanValue.length > maxLength) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede superar ${maxLength} caracteres.`,
    );
  }

  return cleanValue;
}

function normalizeOptionalText(
  value: unknown,
  fieldLabel: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const cleanValue = String(value).trim();

  if (!cleanValue) {
    return null;
  }

  if (cleanValue.length > maxLength) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede superar ${maxLength} caracteres.`,
    );
  }

  return cleanValue;
}

function normalizeLocationCode(value: unknown) {
  const cleanValue = normalizeRequiredText(
    value,
    "El código de la ubicación",
    MAX_CODE_LENGTH,
  ).toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(cleanValue)) {
    throw new InventoryValidationError(
      "El código de la ubicación solo puede contener letras, números, guiones y guiones bajos.",
    );
  }

  return cleanValue;
}

function normalizeLocationType(value: unknown): InventoryLocationType {
  const cleanValue = normalizeRequiredText(
    value,
    "El tipo de ubicación",
    40,
  ).toUpperCase();

  if (!LOCATION_TYPES.has(cleanValue)) {
    throw new InventoryValidationError("El tipo de ubicación no es válido.");
  }

  return cleanValue as InventoryLocationType;
}

function normalizeOptionalLocationType(
  value: unknown,
): InventoryLocationType | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeLocationType(value);
}

function normalizeOptionalBoolean(
  value: unknown,
  fieldLabel: string,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === "true") return true;
    if (normalizedValue === "false") return false;
  }

  throw new InventoryValidationError(`${fieldLabel} no es válido.`);
}

function normalizeOptionalInteger(
  value: unknown,
  fieldLabel: string,
): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    throw new InventoryValidationError(
      `${fieldLabel} debe ser un número entero.`,
    );
  }

  if (parsedValue < 0 || parsedValue > MAX_SORT_ORDER) {
    throw new InventoryValidationError(
      `${fieldLabel} debe estar entre 0 y ${MAX_SORT_ORDER}.`,
    );
  }

  return parsedValue;
}

function normalizeNullableUuid(
  value: unknown,
  fieldLabel: string,
): string | null {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    return null;
  }

  if (!UUID_PATTERN.test(cleanValue)) {
    throw new InventoryValidationError(`${fieldLabel} no es válido.`);
  }

  return cleanValue;
}

function normalizeOptionalNullableUuid(
  value: unknown,
  fieldLabel: string,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeNullableUuid(value, fieldLabel);
}

function normalizeOptionalCountryCode(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const cleanValue = String(value).trim().toUpperCase();

  if (!cleanValue) {
    return null;
  }

  if (!COUNTRY_CODE_PATTERN.test(cleanValue)) {
    throw new InventoryValidationError(
      "El código de país debe contener dos letras.",
    );
  }

  return cleanValue;
}

function normalizeCoordinate(
  value: unknown,
  fieldLabel: string,
  minimum: number,
  maximum: number,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || String(value).trim() === "") {
    return null;
  }

  const cleanValue = String(value).trim();
  const parsedValue = Number(cleanValue);

  if (!Number.isFinite(parsedValue)) {
    throw new InventoryValidationError(`${fieldLabel} no es válida.`);
  }

  if (parsedValue < minimum || parsedValue > maximum) {
    throw new InventoryValidationError(
      `${fieldLabel} debe estar entre ${minimum} y ${maximum}.`,
    );
  }

  return cleanValue;
}

export function validateInventoryLocationCoordinates(params: {
  latitude: string | null | undefined;
  longitude: string | null | undefined;
}) {
  const hasLatitude = params.latitude !== null && params.latitude !== undefined;

  const hasLongitude =
    params.longitude !== null && params.longitude !== undefined;

  if (hasLatitude !== hasLongitude) {
    throw new InventoryValidationError(
      "Debe ingresar latitud y longitud juntas.",
    );
  }
}

function normalizeMetadata(value: unknown): Prisma.InputJsonObject {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new InventoryValidationError(
      "Los metadatos deben ser un objeto JSON.",
    );
  }

  let serializedValue: string;

  try {
    serializedValue = JSON.stringify(value);
  } catch {
    throw new InventoryValidationError(
      "Los metadatos no contienen un JSON válido.",
    );
  }

  if (serializedValue.length > MAX_METADATA_LENGTH) {
    throw new InventoryValidationError(
      `Los metadatos no pueden superar ${MAX_METADATA_LENGTH} caracteres.`,
    );
  }

  return value as Prisma.InputJsonObject;
}

function normalizeOptionalMetadata(
  value: unknown,
): Prisma.InputJsonObject | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeMetadata(value);
}

export function normalizeInventoryLocationId(value: unknown) {
  const locationId = String(value ?? "").trim();

  if (!locationId) {
    throw new InventoryValidationError("El id de la ubicación es requerido.");
  }

  if (!UUID_PATTERN.test(locationId)) {
    throw new InventoryValidationError("El id de la ubicación no es válido.");
  }

  return locationId;
}

export function normalizeInventoryLocationFilters(
  searchParams: URLSearchParams,
): InventoryLocationFilters {
  const rawSearch = searchParams.get("search");
  const rawActiveOnly = searchParams.get("active_only");
  const rawLocationType = searchParams.get("location_type");
  const rawParentLocationId = searchParams.get("parent_location_id");
  const rawRootOnly = searchParams.get("root_only");
  const rawAllowsStock = searchParams.get("allows_stock");
  const rawCountryCode = searchParams.get("country_code");
  const rawIsDefault = searchParams.get("is_default");

  const search = rawSearch?.trim() || undefined;

  if (search && search.length > MAX_SEARCH_LENGTH) {
    throw new InventoryValidationError(
      `La búsqueda no puede superar ${MAX_SEARCH_LENGTH} caracteres.`,
    );
  }

  const activeOnly =
    normalizeOptionalBoolean(rawActiveOnly ?? undefined, "El filtro activo") ??
    true;

  const rootOnly =
    normalizeOptionalBoolean(
      rawRootOnly ?? undefined,
      "El filtro de ubicaciones principales",
    ) ?? false;

  const parentLocationId = rawParentLocationId
    ? normalizeInventoryLocationId(rawParentLocationId)
    : undefined;

  if (rootOnly && parentLocationId) {
    throw new InventoryValidationError(
      "No puede combinar root_only con parent_location_id.",
    );
  }

  const countryCode = rawCountryCode
    ? (normalizeOptionalCountryCode(rawCountryCode) ?? undefined)
    : undefined;

  return {
    search,
    activeOnly,
    rootOnly,
    parentLocationId,
    countryCode,
    locationType: rawLocationType
      ? normalizeLocationType(rawLocationType)
      : undefined,
    allowsStock: normalizeOptionalBoolean(
      rawAllowsStock ?? undefined,
      "El filtro de almacenamiento",
    ),
    isDefault: normalizeOptionalBoolean(
      rawIsDefault ?? undefined,
      "El filtro de ubicación predeterminada",
    ),
  };
}

export function normalizeInventoryLocationCreateInput(
  input: unknown,
): InventoryLocationCreateData {
  const record = normalizeInputRecord(input);

  const latitude =
    normalizeCoordinate(record.latitude, "La latitud", -90, 90) ?? null;

  const longitude =
    normalizeCoordinate(record.longitude, "La longitud", -180, 180) ?? null;

  validateInventoryLocationCoordinates({
    latitude,
    longitude,
  });

  return {
    parent_location_id: normalizeNullableUuid(
      record.parent_location_id,
      "El id de la ubicación padre",
    ),
    location_code: normalizeLocationCode(record.location_code),
    name: normalizeRequiredText(
      record.name,
      "El nombre de la ubicación",
      MAX_NAME_LENGTH,
    ),
    description: normalizeOptionalText(
      record.description,
      "La descripción",
      MAX_DESCRIPTION_LENGTH,
    ),
    location_type: normalizeLocationType(record.location_type),
    country_code: normalizeOptionalCountryCode(record.country_code),
    address_line: normalizeOptionalText(
      record.address_line,
      "La dirección",
      MAX_ADDRESS_LENGTH,
    ),
    reference_point: normalizeOptionalText(
      record.reference_point,
      "El punto de referencia",
      MAX_REFERENCE_LENGTH,
    ),
    latitude,
    longitude,
    allows_stock:
      normalizeOptionalBoolean(
        record.allows_stock,
        "El indicador de almacenamiento",
      ) ?? true,
    is_default:
      normalizeOptionalBoolean(
        record.is_default,
        "El indicador de ubicación predeterminada",
      ) ?? false,
    sort_order: normalizeOptionalInteger(record.sort_order, "El orden") ?? 0,
    metadata: normalizeMetadata(record.metadata),
  };
}

export function normalizeInventoryLocationUpdateInput(
  input: unknown,
): InventoryLocationUpdateData {
  const record = normalizeInputRecord(input);
  const data: InventoryLocationUpdateData = {};

  if (record.parent_location_id !== undefined) {
    data.parent_location_id = normalizeOptionalNullableUuid(
      record.parent_location_id,
      "El id de la ubicación padre",
    );
  }

  if (record.location_code !== undefined) {
    data.location_code = normalizeLocationCode(record.location_code);
  }

  if (record.name !== undefined) {
    data.name = normalizeRequiredText(
      record.name,
      "El nombre de la ubicación",
      MAX_NAME_LENGTH,
    );
  }

  if (record.description !== undefined) {
    data.description = normalizeOptionalText(
      record.description,
      "La descripción",
      MAX_DESCRIPTION_LENGTH,
    );
  }

  if (record.location_type !== undefined) {
    data.location_type = normalizeOptionalLocationType(record.location_type);
  }

  if (record.country_code !== undefined) {
    data.country_code = normalizeOptionalCountryCode(record.country_code);
  }

  if (record.address_line !== undefined) {
    data.address_line = normalizeOptionalText(
      record.address_line,
      "La dirección",
      MAX_ADDRESS_LENGTH,
    );
  }

  if (record.reference_point !== undefined) {
    data.reference_point = normalizeOptionalText(
      record.reference_point,
      "El punto de referencia",
      MAX_REFERENCE_LENGTH,
    );
  }

  if (record.latitude !== undefined) {
    data.latitude = normalizeCoordinate(record.latitude, "La latitud", -90, 90);
  }

  if (record.longitude !== undefined) {
    data.longitude = normalizeCoordinate(
      record.longitude,
      "La longitud",
      -180,
      180,
    );
  }

  if (record.allows_stock !== undefined) {
    data.allows_stock = normalizeOptionalBoolean(
      record.allows_stock,
      "El indicador de almacenamiento",
    );
  }

  if (record.is_default !== undefined) {
    data.is_default = normalizeOptionalBoolean(
      record.is_default,
      "El indicador de ubicación predeterminada",
    );
  }

  if (record.sort_order !== undefined) {
    data.sort_order = normalizeOptionalInteger(record.sort_order, "El orden");
  }

  if (record.metadata !== undefined) {
    data.metadata = normalizeOptionalMetadata(record.metadata);
  }

  if (record.is_active !== undefined) {
    data.is_active = normalizeOptionalBoolean(
      record.is_active,
      "El estado de la ubicación",
    );
  }

  if (Object.keys(data).length === 0) {
    throw new InventoryValidationError(
      "Debe indicar al menos un campo para actualizar.",
    );
  }

  return data;
}
