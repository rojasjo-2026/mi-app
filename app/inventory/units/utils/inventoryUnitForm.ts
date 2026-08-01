import type {
  InventoryUnitFormErrors,
  InventoryUnitFormState,
  InventoryUnitOfMeasure,
} from "../types";
import type {
  InventoryUnitCreatePayload,
  InventoryUnitUpdatePayload,
} from "../hooks/useInventoryUnitMutations";

const MAX_UNIT_CODE_LENGTH = 20;
const MAX_UNIT_NAME_LENGTH = 100;
const MAX_UNIT_SYMBOL_LENGTH = 20;
const MAX_DECIMAL_SCALE = 6;

export const DEFAULT_INVENTORY_UNIT_FORM: InventoryUnitFormState = {
  code: "",
  name: "",
  symbol: "",
  allowsDecimal: true,
  decimalScale: "2",
};

export function createInventoryUnitFormFromDetail(
  detail: InventoryUnitOfMeasure,
): InventoryUnitFormState {
  return {
    code: detail.code,
    name: detail.name,
    symbol: detail.symbol || "",
    allowsDecimal: detail.allows_decimal,
    decimalScale: String(detail.allows_decimal ? detail.decimal_scale : 0),
  };
}

export function normalizeInventoryUnitForm(
  form: InventoryUnitFormState,
): InventoryUnitFormState {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    symbol: form.symbol.trim(),
    allowsDecimal: form.allowsDecimal,
    decimalScale: form.allowsDecimal ? form.decimalScale.trim() : "0",
  };
}

export function validateInventoryUnitForm(form: InventoryUnitFormState) {
  const normalized = normalizeInventoryUnitForm(form);

  const errors: InventoryUnitFormErrors = {};

  if (!normalized.code) {
    errors.code = "El código de la unidad es requerido.";
  } else if (normalized.code.length > MAX_UNIT_CODE_LENGTH) {
    errors.code = `El código no puede superar ${MAX_UNIT_CODE_LENGTH} caracteres.`;
  } else if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(normalized.code)) {
    errors.code = "Usá únicamente letras, números, guiones y guiones bajos.";
  }

  if (!normalized.name) {
    errors.name = "El nombre de la unidad es requerido.";
  } else if (normalized.name.length > MAX_UNIT_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_UNIT_NAME_LENGTH} caracteres.`;
  }

  if (normalized.symbol.length > MAX_UNIT_SYMBOL_LENGTH) {
    errors.symbol = `El símbolo no puede superar ${MAX_UNIT_SYMBOL_LENGTH} caracteres.`;
  }

  if (normalized.allowsDecimal) {
    const decimalScale = Number(normalized.decimalScale);

    if (!normalized.decimalScale) {
      errors.decimalScale = "La cantidad de decimales es requerida.";
    } else if (!Number.isInteger(decimalScale)) {
      errors.decimalScale =
        "La cantidad de decimales debe ser un número entero.";
    } else if (decimalScale < 0 || decimalScale > MAX_DECIMAL_SCALE) {
      errors.decimalScale = `La cantidad de decimales debe estar entre 0 y ${MAX_DECIMAL_SCALE}.`;
    }
  }

  return {
    normalized,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function buildInventoryUnitCreatePayload(
  form: InventoryUnitFormState,
): InventoryUnitCreatePayload {
  const normalized = normalizeInventoryUnitForm(form);

  return {
    code: normalized.code,
    name: normalized.name,
    symbol: normalized.symbol || null,
    allows_decimal: normalized.allowsDecimal,
    decimal_scale: normalized.allowsDecimal
      ? Number(normalized.decimalScale)
      : 0,
  };
}

export function buildInventoryUnitUpdatePayload(
  form: InventoryUnitFormState,
): InventoryUnitUpdatePayload {
  return buildInventoryUnitCreatePayload(form);
}
