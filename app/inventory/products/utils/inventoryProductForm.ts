import type {
  InventoryProductDetail,
  InventoryProductType,
  InventoryTrackingMode,
  InventoryVariant,
} from "../types";

export type InventoryProductFormMode = "create" | "edit";

export type InventoryProductFormState = {
  categoryId: string;
  name: string;
  description: string;
  brand: string;
  model: string;
  productType: InventoryProductType;
  trackingMode: InventoryTrackingMode;
  managesStock: boolean;
  hasExpiration: boolean;
  allowNegativeStock: boolean;
  taxExempt: boolean;
  taxRate: string;
  stockUnitId: string;
  variantName: string;
  defaultCost: string;
  defaultPrice: string;
  minimumStock: string;
  maximumStock: string;
};

export type InventoryProductFormErrors = Partial<
  Record<keyof InventoryProductFormState, string>
>;

export const DEFAULT_PRODUCT_FORM: InventoryProductFormState = {
  categoryId: "",
  name: "",
  description: "",
  brand: "",
  model: "",
  productType: "STOCK_ITEM",
  trackingMode: "NONE",
  managesStock: true,
  hasExpiration: false,
  allowNegativeStock: false,
  taxExempt: false,
  taxRate: "",
  stockUnitId: "",
  variantName: "",
  defaultCost: "",
  defaultPrice: "",
  minimumStock: "0",
  maximumStock: "",
};

function cleanText(value: string) {
  return value.trim();
}

function nullableText(value: string) {
  const cleanValue = cleanText(value);

  return cleanValue || null;
}

function normalizeDecimalText(value: string) {
  return cleanText(value).replace(",", ".");
}

function parseDecimal(value: string) {
  const normalized = normalizeDecimalText(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function isValidNonNegativeDecimal(value: string) {
  if (!cleanText(value)) {
    return true;
  }

  const parsed = parseDecimal(value);

  return parsed !== null && parsed >= 0;
}

export function normalizeProductFormRules(
  form: InventoryProductFormState,
): InventoryProductFormState {
  return {
    ...form,
    trackingMode: form.managesStock ? form.trackingMode : "NONE",
    hasExpiration: form.managesStock ? form.hasExpiration : false,
    allowNegativeStock: form.managesStock ? form.allowNegativeStock : false,
    taxRate: form.taxExempt ? "" : form.taxRate,
  };
}

export function createProductFormFromDetail(
  detail: InventoryProductDetail,
  defaultVariant: InventoryVariant | null,
): InventoryProductFormState {
  return normalizeProductFormRules({
    categoryId: detail.inventory_category_id || "",
    name: detail.name,
    description: detail.description || "",
    brand: detail.brand || "",
    model: detail.model || "",
    productType: detail.product_type,
    trackingMode: detail.tracking_mode,
    managesStock: detail.manages_stock,
    hasExpiration: detail.has_expiration,
    allowNegativeStock: detail.allow_negative_stock,
    taxExempt: detail.tax_exempt,
    taxRate: detail.tax_rate === null ? "" : detail.tax_rate,
    stockUnitId: defaultVariant?.stock_unit_id || "",
    variantName: defaultVariant?.name || "",
    defaultCost: defaultVariant?.default_cost || "",
    defaultPrice: defaultVariant?.default_price || "",
    minimumStock: defaultVariant?.minimum_stock || "0",
    maximumStock: defaultVariant?.maximum_stock || "",
  });
}

export function validateProductForm(
  form: InventoryProductFormState,
  mode: InventoryProductFormMode,
): InventoryProductFormErrors {
  const normalized = normalizeProductFormRules(form);

  const errors: InventoryProductFormErrors = {};

  if (!cleanText(normalized.name)) {
    errors.name = "El nombre del producto es requerido.";
  }

  if (mode === "create" && !normalized.stockUnitId) {
    errors.stockUnitId = "Seleccione la unidad de la variante predeterminada.";
  }

  if (!normalized.taxExempt && cleanText(normalized.taxRate)) {
    const taxRate = parseDecimal(normalized.taxRate);

    if (taxRate === null || taxRate < 0 || taxRate > 100) {
      errors.taxRate = "La tasa debe estar entre 0 y 100.";
    }
  }

  const decimalFields: Array<{
    field: "defaultCost" | "defaultPrice" | "minimumStock" | "maximumStock";
    label: string;
    value: string;
  }> = [
    {
      field: "defaultCost",
      label: "El costo",
      value: normalized.defaultCost,
    },
    {
      field: "defaultPrice",
      label: "El precio",
      value: normalized.defaultPrice,
    },
    {
      field: "minimumStock",
      label: "La existencia mínima",
      value: normalized.minimumStock,
    },
    {
      field: "maximumStock",
      label: "La existencia máxima",
      value: normalized.maximumStock,
    },
  ];

  if (mode === "create") {
    for (const decimalField of decimalFields) {
      if (!isValidNonNegativeDecimal(decimalField.value)) {
        errors[decimalField.field] =
          `${decimalField.label} debe ser un número mayor o igual a cero.`;
      }
    }

    const minimum = parseDecimal(normalized.minimumStock) ?? 0;

    const maximum = parseDecimal(normalized.maximumStock);

    if (maximum !== null && maximum < minimum) {
      errors.maximumStock =
        "La existencia máxima no puede ser menor que la mínima.";
    }
  }

  return errors;
}

export function hasProductFormErrors(errors: InventoryProductFormErrors) {
  return Object.keys(errors).length > 0;
}

export function buildCreateProductPayload(form: InventoryProductFormState) {
  const normalized = normalizeProductFormRules(form);

  return {
    inventory_category_id: normalized.categoryId || null,
    name: cleanText(normalized.name),
    description: nullableText(normalized.description),
    brand: nullableText(normalized.brand),
    model: nullableText(normalized.model),
    product_type: normalized.productType,
    tracking_mode: normalized.trackingMode,
    manages_stock: normalized.managesStock,
    has_expiration: normalized.hasExpiration,
    allow_negative_stock: normalized.allowNegativeStock,
    tax_exempt: normalized.taxExempt,
    tax_rate: normalized.taxExempt
      ? null
      : nullableText(normalizeDecimalText(normalized.taxRate)),
    attributes: {},
    default_variant: {
      stock_unit_id: normalized.stockUnitId,
      name: nullableText(normalized.variantName),
      attributes: {},
      default_cost: nullableText(normalizeDecimalText(normalized.defaultCost)),
      default_price: nullableText(
        normalizeDecimalText(normalized.defaultPrice),
      ),
      minimum_stock: normalizeDecimalText(normalized.minimumStock) || "0",
      maximum_stock: nullableText(
        normalizeDecimalText(normalized.maximumStock),
      ),
      is_default: true,
      sort_order: 0,
    },
  };
}

export function buildUpdateProductPayload(form: InventoryProductFormState) {
  const normalized = normalizeProductFormRules(form);

  return {
    inventory_category_id: normalized.categoryId || null,
    name: cleanText(normalized.name),
    description: nullableText(normalized.description),
    brand: nullableText(normalized.brand),
    model: nullableText(normalized.model),
    product_type: normalized.productType,
    tracking_mode: normalized.trackingMode,
    manages_stock: normalized.managesStock,
    has_expiration: normalized.hasExpiration,
    allow_negative_stock: normalized.allowNegativeStock,
    tax_exempt: normalized.taxExempt,
    tax_rate: normalized.taxExempt
      ? null
      : nullableText(normalizeDecimalText(normalized.taxRate)),
  };
}
