import { InventoryValidationError } from "../shared/inventoryErrors";

import type {
  UnitOfMeasureCreateData,
  UnitOfMeasureFilters,
  UnitOfMeasureUpdateData,
} from "./unitOfMeasure.types";

const MAX_CODE_LENGTH = 20;
const MAX_NAME_LENGTH = 100;
const MAX_SYMBOL_LENGTH = 20;
const MAX_SEARCH_LENGTH = 100;
const MAX_DECIMAL_SCALE = 6;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
) {
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

function normalizeUnitCode(value: unknown) {
  const cleanValue = normalizeRequiredText(
    value,
    "El código de la unidad",
    MAX_CODE_LENGTH,
  ).toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(cleanValue)) {
    throw new InventoryValidationError(
      "El código de la unidad solo puede contener letras, números, guiones y guiones bajos.",
    );
  }

  return cleanValue;
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

  return parsedValue;
}

function normalizeDecimalScale(value: unknown) {
  const decimalScale = normalizeOptionalInteger(
    value,
    "La cantidad de decimales",
  );

  if (decimalScale === undefined) {
    return undefined;
  }

  if (decimalScale < 0 || decimalScale > MAX_DECIMAL_SCALE) {
    throw new InventoryValidationError(
      `La cantidad de decimales debe estar entre 0 y ${MAX_DECIMAL_SCALE}.`,
    );
  }

  return decimalScale;
}

export function normalizeUnitOfMeasureId(value: unknown) {
  const unitId = String(value ?? "").trim();

  if (!unitId) {
    throw new InventoryValidationError(
      "El id de la unidad de medida es requerido.",
    );
  }

  if (!UUID_PATTERN.test(unitId)) {
    throw new InventoryValidationError(
      "El id de la unidad de medida no es válido.",
    );
  }

  return unitId;
}

export function normalizeUnitOfMeasureFilters(
  searchParams: URLSearchParams,
): UnitOfMeasureFilters {
  const rawSearch = searchParams.get("search");
  const rawActiveOnly = searchParams.get("active_only");

  const search = rawSearch?.trim() || undefined;

  if (search && search.length > MAX_SEARCH_LENGTH) {
    throw new InventoryValidationError(
      `La búsqueda no puede superar ${MAX_SEARCH_LENGTH} caracteres.`,
    );
  }

  const activeOnly =
    normalizeOptionalBoolean(rawActiveOnly ?? undefined, "El filtro activo") ??
    true;

  return {
    search,
    activeOnly,
  };
}

export function normalizeUnitOfMeasureCreateInput(
  input: unknown,
): UnitOfMeasureCreateData {
  const record = normalizeInputRecord(input);

  const allowsDecimal =
    normalizeOptionalBoolean(
      record.allows_decimal,
      "El indicador de decimales",
    ) ?? true;

  const requestedDecimalScale = normalizeDecimalScale(record.decimal_scale);

  return {
    code: normalizeUnitCode(record.code),
    name: normalizeRequiredText(
      record.name,
      "El nombre de la unidad",
      MAX_NAME_LENGTH,
    ),
    symbol: normalizeOptionalText(
      record.symbol,
      "El símbolo de la unidad",
      MAX_SYMBOL_LENGTH,
    ),
    allows_decimal: allowsDecimal,
    decimal_scale: allowsDecimal ? (requestedDecimalScale ?? 2) : 0,
  };
}

export function normalizeUnitOfMeasureUpdateInput(
  input: unknown,
): UnitOfMeasureUpdateData {
  const record = normalizeInputRecord(input);
  const data: UnitOfMeasureUpdateData = {};

  if (record.code !== undefined) {
    data.code = normalizeUnitCode(record.code);
  }

  if (record.name !== undefined) {
    data.name = normalizeRequiredText(
      record.name,
      "El nombre de la unidad",
      MAX_NAME_LENGTH,
    );
  }

  if (record.symbol !== undefined) {
    data.symbol = normalizeOptionalText(
      record.symbol,
      "El símbolo de la unidad",
      MAX_SYMBOL_LENGTH,
    );
  }

  if (record.allows_decimal !== undefined) {
    data.allows_decimal = normalizeOptionalBoolean(
      record.allows_decimal,
      "El indicador de decimales",
    );
  }

  if (record.decimal_scale !== undefined) {
    data.decimal_scale = normalizeDecimalScale(record.decimal_scale);
  }

  if (record.is_active !== undefined) {
    data.is_active = normalizeOptionalBoolean(
      record.is_active,
      "El estado de la unidad",
    );
  }

  if (data.allows_decimal === false) {
    data.decimal_scale = 0;
  }

  if (Object.keys(data).length === 0) {
    throw new InventoryValidationError(
      "Debe indicar al menos un campo para actualizar.",
    );
  }

  return data;
}
