import { InventoryValidationError } from "../shared/inventoryErrors";

import type {
  InventoryCategoryCreateData,
  InventoryCategoryFilters,
  InventoryCategoryUpdateData,
} from "./inventoryCategory.types";

const MAX_CODE_LENGTH = 40;
const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SEARCH_LENGTH = 100;
const MAX_SORT_ORDER = 1_000_000;

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

function normalizeOptionalCategoryCode(value: unknown) {
  const cleanValue = normalizeOptionalText(
    value,
    "El código de la categoría",
    MAX_CODE_LENGTH,
  );

  if (!cleanValue) {
    return null;
  }

  const normalizedCode = cleanValue.toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(normalizedCode)) {
    throw new InventoryValidationError(
      "El código de la categoría solo puede contener letras, números, guiones y guiones bajos.",
    );
  }

  return normalizedCode;
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

function normalizeNullableUuid(value: unknown, fieldLabel: string) {
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

export function normalizeInventoryCategoryId(value: unknown) {
  const categoryId = String(value ?? "").trim();

  if (!categoryId) {
    throw new InventoryValidationError("El id de la categoría es requerido.");
  }

  if (!UUID_PATTERN.test(categoryId)) {
    throw new InventoryValidationError("El id de la categoría no es válido.");
  }

  return categoryId;
}

export function normalizeInventoryCategoryFilters(
  searchParams: URLSearchParams,
): InventoryCategoryFilters {
  const rawSearch = searchParams.get("search");
  const rawActiveOnly = searchParams.get("active_only");
  const rawParentCategoryId = searchParams.get("parent_category_id");
  const rawRootOnly = searchParams.get("root_only");

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
      "El filtro de categorías principales",
    ) ?? false;

  const parentCategoryId = rawParentCategoryId
    ? normalizeInventoryCategoryId(rawParentCategoryId)
    : undefined;

  if (rootOnly && parentCategoryId) {
    throw new InventoryValidationError(
      "No puede combinar root_only con parent_category_id.",
    );
  }

  return {
    search,
    activeOnly,
    parentCategoryId,
    rootOnly,
  };
}

export function normalizeInventoryCategoryCreateInput(
  input: unknown,
): InventoryCategoryCreateData {
  const record = normalizeInputRecord(input);

  return {
    category_code: normalizeOptionalCategoryCode(record.category_code),
    name: normalizeRequiredText(
      record.name,
      "El nombre de la categoría",
      MAX_NAME_LENGTH,
    ),
    description: normalizeOptionalText(
      record.description,
      "La descripción",
      MAX_DESCRIPTION_LENGTH,
    ),
    parent_category_id: normalizeNullableUuid(
      record.parent_category_id,
      "El id de la categoría padre",
    ),
    sort_order: normalizeOptionalInteger(record.sort_order, "El orden") ?? 0,
  };
}

export function normalizeInventoryCategoryUpdateInput(
  input: unknown,
): InventoryCategoryUpdateData {
  const record = normalizeInputRecord(input);
  const data: InventoryCategoryUpdateData = {};

  if (record.category_code !== undefined) {
    data.category_code = normalizeOptionalCategoryCode(record.category_code);
  }

  if (record.name !== undefined) {
    data.name = normalizeRequiredText(
      record.name,
      "El nombre de la categoría",
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

  if (record.parent_category_id !== undefined) {
    data.parent_category_id = normalizeOptionalNullableUuid(
      record.parent_category_id,
      "El id de la categoría padre",
    );
  }

  if (record.sort_order !== undefined) {
    data.sort_order = normalizeOptionalInteger(record.sort_order, "El orden");
  }

  if (record.is_active !== undefined) {
    data.is_active = normalizeOptionalBoolean(
      record.is_active,
      "El estado de la categoría",
    );
  }

  if (Object.keys(data).length === 0) {
    throw new InventoryValidationError(
      "Debe indicar al menos un campo para actualizar.",
    );
  }

  return data;
}
