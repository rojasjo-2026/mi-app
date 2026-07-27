import { Prisma } from "@prisma/client";

import { InventoryValidationError } from "./inventoryErrors";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type IntegerOptions = {
  minimum?: number;
  maximum?: number;
};

type DecimalOptions = {
  precision: number;
  scale: number;
  required?: boolean;
  nullable?: boolean;
  minimum?: string;
  maximum?: string;
};

export function normalizeCatalogInputRecord(
  input: unknown,
): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new InventoryValidationError(
      "El cuerpo de la solicitud no es válido.",
    );
  }

  return input as Record<string, unknown>;
}

export function normalizeCatalogRequiredText(
  value: unknown,
  fieldLabel: string,
  maximumLength: number,
) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    throw new InventoryValidationError(`${fieldLabel} es requerido.`);
  }

  if (cleanValue.length > maximumLength) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede superar ${maximumLength} caracteres.`,
    );
  }

  return cleanValue;
}

export function normalizeCatalogOptionalText(
  value: unknown,
  fieldLabel: string,
  maximumLength: number,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const cleanValue = String(value).trim();

  if (!cleanValue) {
    return null;
  }

  if (cleanValue.length > maximumLength) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede superar ${maximumLength} caracteres.`,
    );
  }

  return cleanValue;
}

export function normalizeCatalogOptionalBoolean(
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
    const cleanValue = value.trim().toLowerCase();

    if (cleanValue === "true") return true;
    if (cleanValue === "false") return false;
  }

  throw new InventoryValidationError(`${fieldLabel} no es válido.`);
}

export function normalizeCatalogOptionalInteger(
  value: unknown,
  fieldLabel: string,
  options: IntegerOptions = {},
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

  if (options.minimum !== undefined && parsedValue < options.minimum) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede ser menor que ${options.minimum}.`,
    );
  }

  if (options.maximum !== undefined && parsedValue > options.maximum) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede ser mayor que ${options.maximum}.`,
    );
  }

  return parsedValue;
}

export function normalizeCatalogUuid(value: unknown, fieldLabel: string) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    throw new InventoryValidationError(`${fieldLabel} es requerido.`);
  }

  if (!UUID_PATTERN.test(cleanValue)) {
    throw new InventoryValidationError(`${fieldLabel} no es válido.`);
  }

  return cleanValue;
}

export function normalizeCatalogNullableUuid(
  value: unknown,
  fieldLabel: string,
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return normalizeCatalogUuid(value, fieldLabel);
}

export function normalizeCatalogOptionalNullableUuid(
  value: unknown,
  fieldLabel: string,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeCatalogNullableUuid(value, fieldLabel);
}

export function normalizeCatalogSearch(
  value: unknown,
  maximumLength = 100,
): string | undefined {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    return undefined;
  }

  if (cleanValue.length > maximumLength) {
    throw new InventoryValidationError(
      `La búsqueda no puede superar ${maximumLength} caracteres.`,
    );
  }

  return cleanValue;
}

export function normalizeCatalogEnum<T extends string>(
  value: unknown,
  fieldLabel: string,
  allowedValues: readonly T[],
): T {
  const cleanValue = normalizeCatalogRequiredText(
    value,
    fieldLabel,
    50,
  ).toUpperCase();

  if (!allowedValues.includes(cleanValue as T)) {
    throw new InventoryValidationError(`${fieldLabel} no es válido.`);
  }

  return cleanValue as T;
}

export function normalizeCatalogDecimal(
  value: unknown,
  fieldLabel: string,
  options: DecimalOptions,
): string | null | undefined {
  if (value === undefined) {
    if (options.required) {
      throw new InventoryValidationError(`${fieldLabel} es requerido.`);
    }

    return undefined;
  }

  if (value === null || String(value).trim() === "") {
    if (options.nullable) {
      return null;
    }

    throw new InventoryValidationError(`${fieldLabel} es requerido.`);
  }

  const cleanValue = String(value).trim();

  if (!/^[+-]?\d+(?:\.\d+)?$/.test(cleanValue)) {
    throw new InventoryValidationError(
      `${fieldLabel} debe ser un número válido.`,
    );
  }

  const unsignedValue = cleanValue.replace(/^[+-]/, "");
  const [rawIntegerPart, fractionPart = ""] = unsignedValue.split(".");

  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, "") || "0";

  const totalDigits = integerPart.length + fractionPart.length;

  if (totalDigits > options.precision) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede superar ${options.precision} dígitos.`,
    );
  }

  if (fractionPart.length > options.scale) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede tener más de ${options.scale} decimales.`,
    );
  }

  const decimalValue = new Prisma.Decimal(cleanValue);

  if (
    options.minimum !== undefined &&
    decimalValue.lessThan(new Prisma.Decimal(options.minimum))
  ) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede ser menor que ${options.minimum}.`,
    );
  }

  if (
    options.maximum !== undefined &&
    decimalValue.greaterThan(new Prisma.Decimal(options.maximum))
  ) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede ser mayor que ${options.maximum}.`,
    );
  }

  return decimalValue.toString();
}

export function normalizeCatalogJsonObject(
  value: unknown,
  fieldLabel: string,
  maximumLength = 20_000,
): Prisma.InputJsonObject {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new InventoryValidationError(
      `${fieldLabel} debe ser un objeto JSON.`,
    );
  }

  let serializedValue: string;

  try {
    serializedValue = JSON.stringify(value);
  } catch {
    throw new InventoryValidationError(
      `${fieldLabel} no contiene un JSON válido.`,
    );
  }

  if (serializedValue.length > maximumLength) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede superar ${maximumLength} caracteres.`,
    );
  }

  return value as Prisma.InputJsonObject;
}

export function normalizeCatalogOptionalJsonObject(
  value: unknown,
  fieldLabel: string,
): Prisma.InputJsonObject | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeCatalogJsonObject(value, fieldLabel);
}

export function requireCatalogUpdateFields(data: Record<string, unknown>) {
  if (Object.keys(data).length === 0) {
    throw new InventoryValidationError(
      "Debe indicar al menos un campo para actualizar.",
    );
  }
}
