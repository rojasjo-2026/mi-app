import type { InventoryVariant } from "../../types";
import type {
  InventoryCode,
  InventoryCodeFormErrors,
  InventoryCodeFormState,
  InventoryCodeMutationInput,
  InventoryVariantFormErrors,
  InventoryVariantFormState,
  InventoryVariantMutationInput,
} from "../types";

const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;

function nullableText(value: string) {
  const normalized = value.trim();

  return normalized || null;
}

function isValidDecimal(value: string, maximumScale: number) {
  const normalized = value.trim();

  if (!normalized || !DECIMAL_PATTERN.test(normalized)) {
    return false;
  }

  const decimalPart = normalized.split(".")[1] || "";

  return decimalPart.length <= maximumScale;
}

function isNonNegativeDecimal(value: string, maximumScale: number) {
  return isValidDecimal(value, maximumScale) && Number(value) >= 0;
}

function isPositiveDecimal(value: string, maximumScale: number) {
  return isValidDecimal(value, maximumScale) && Number(value) > 0;
}

function normalizeVariantAttributes(
  attributes: unknown,
): Record<string, unknown> {
  if (
    typeof attributes === "object" &&
    attributes !== null &&
    !Array.isArray(attributes)
  ) {
    return attributes as Record<string, unknown>;
  }

  return {};
}

export function createEmptyInventoryVariantFormState(): InventoryVariantFormState {
  return {
    stockUnitId: "",
    name: "",
    defaultCost: "",
    defaultPrice: "",
    minimumStock: "0",
    maximumStock: "",
    isDefault: false,
    sortOrder: "0",
  };
}

export function createInventoryVariantEditFormState(
  variant: InventoryVariant,
): InventoryVariantFormState {
  return {
    stockUnitId: variant.stock_unit_id,
    name: variant.name || "",
    defaultCost: variant.default_cost || "",
    defaultPrice: variant.default_price || "",
    minimumStock: variant.minimum_stock,
    maximumStock: variant.maximum_stock || "",
    isDefault: variant.is_default,
    sortOrder: String(variant.sort_order),
  };
}

export function validateInventoryVariantForm(
  state: InventoryVariantFormState,
): InventoryVariantFormErrors {
  const errors: InventoryVariantFormErrors = {};

  if (!state.stockUnitId) {
    errors.stockUnitId = "Seleccione una unidad de inventario.";
  }

  if (state.name.trim().length > 160) {
    errors.name = "El nombre no puede superar 160 caracteres.";
  }

  if (state.defaultCost.trim() && !isNonNegativeDecimal(state.defaultCost, 4)) {
    errors.defaultCost = "Ingrese un costo válido con hasta 4 decimales.";
  }

  if (
    state.defaultPrice.trim() &&
    !isNonNegativeDecimal(state.defaultPrice, 2)
  ) {
    errors.defaultPrice = "Ingrese un precio válido con hasta 2 decimales.";
  }

  if (!isNonNegativeDecimal(state.minimumStock, 6)) {
    errors.minimumStock =
      "Ingrese un inventario mínimo válido con hasta 6 decimales.";
  }

  if (
    state.maximumStock.trim() &&
    !isNonNegativeDecimal(state.maximumStock, 6)
  ) {
    errors.maximumStock =
      "Ingrese un inventario máximo válido con hasta 6 decimales.";
  }

  if (
    !errors.minimumStock &&
    !errors.maximumStock &&
    state.maximumStock.trim() &&
    Number(state.maximumStock) < Number(state.minimumStock)
  ) {
    errors.maximumStock =
      "El inventario máximo debe ser igual o mayor que el mínimo.";
  }

  const sortOrder = Number(state.sortOrder);

  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 1_000_000) {
    errors.sortOrder = "El orden debe ser un entero entre 0 y 1000000.";
  }

  return errors;
}

export function buildInventoryVariantPayload(
  state: InventoryVariantFormState,
  existingVariant?: InventoryVariant | null,
): InventoryVariantMutationInput {
  return {
    stock_unit_id: state.stockUnitId,
    name: nullableText(state.name),
    default_cost: nullableText(state.defaultCost),
    default_price: nullableText(state.defaultPrice),
    minimum_stock: state.minimumStock.trim() || "0",
    maximum_stock: nullableText(state.maximumStock),
    is_default: state.isDefault,
    sort_order: Number(state.sortOrder.trim() || "0"),
    attributes: normalizeVariantAttributes(existingVariant?.attributes),
  };
}

export function createEmptyInventoryCodeFormState(): InventoryCodeFormState {
  return {
    unitOfMeasureId: "",
    code: "",
    codeType: "SKU",
    label: "",
    quantityInStockUnit: "1",
    isPrimary: false,
    isScannable: true,
  };
}

export function createInventoryCodeEditFormState(
  code: InventoryCode,
): InventoryCodeFormState {
  return {
    unitOfMeasureId: code.unit_of_measure_id || "",
    code: code.code,
    codeType: code.code_type,
    label: code.label || "",
    quantityInStockUnit: code.quantity_in_stock_unit,
    isPrimary: code.is_primary,
    isScannable: code.is_scannable,
  };
}

export function validateInventoryCodeForm(
  state: InventoryCodeFormState,
): InventoryCodeFormErrors {
  const errors: InventoryCodeFormErrors = {};
  const code = state.code.trim();

  if (!code) {
    errors.code = "El código es requerido.";
  } else if (code.length > 255) {
    errors.code = "El código no puede superar 255 caracteres.";
  } else if (/[\u0000-\u001F\u007F]/.test(code)) {
    errors.code = "El código debe estar en una sola línea.";
  }

  if (state.label.trim().length > 160) {
    errors.label = "La etiqueta no puede superar 160 caracteres.";
  }

  if (!isPositiveDecimal(state.quantityInStockUnit, 6)) {
    errors.quantityInStockUnit =
      "La cantidad debe ser mayor que cero y tener hasta 6 decimales.";
  }

  if (
    !state.unitOfMeasureId &&
    !errors.quantityInStockUnit &&
    Number(state.quantityInStockUnit) !== 1
  ) {
    errors.quantityInStockUnit =
      "Sin una unidad alternativa, la cantidad debe ser 1.";
  }

  return errors;
}

export function buildInventoryCodePayload(
  state: InventoryCodeFormState,
): InventoryCodeMutationInput {
  return {
    unit_of_measure_id: state.unitOfMeasureId || null,
    code: state.code.trim(),
    code_type: state.codeType,
    label: nullableText(state.label),
    quantity_in_stock_unit: state.quantityInStockUnit.trim() || "1",
    is_primary: state.isPrimary,
    is_scannable: state.isScannable,
  };
}

export function toInventoryPresentationLanguage(message: string) {
  return message
    .replace(/\bVariantes\b/g, "Presentaciones")
    .replace(/\bvariantes\b/g, "presentaciones")
    .replace(/\bVariante\b/g, "Presentación")
    .replace(/\bvariante\b/g, "presentación");
}
export function getFirstVariantFormError(errors: InventoryVariantFormErrors) {
  return Object.values(errors).find(Boolean);
}

export function getFirstCodeFormError(errors: InventoryCodeFormErrors) {
  return Object.values(errors).find(Boolean);
}
