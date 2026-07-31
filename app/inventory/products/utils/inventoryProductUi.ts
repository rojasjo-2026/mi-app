import type {
  InventoryProduct,
  InventoryProductType,
  InventoryTrackingMode,
  InventoryVariant,
  InventoryVariantSummary,
} from "../types";

const productTypeLabels: Record<InventoryProductType, string> = {
  STOCK_ITEM: "Artículo de inventario",
  CONSUMABLE: "Consumible",
  SPARE_PART: "Repuesto",
  ASSET: "Activo",
  RAW_MATERIAL: "Materia prima",
  FINISHED_GOOD: "Producto terminado",
  KIT: "Kit",
  SERVICE: "Servicio",
};

const trackingModeLabels: Record<InventoryTrackingMode, string> = {
  NONE: "Sin seguimiento",
  SERIAL: "Número de serie",
  LOT: "Lote",
};

export function parseInventoryProductDecimal(
  value: string | number | null | undefined,
) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatInventoryProductMoney(
  value: string | number | null,
  locale: string,
  currency: string,
) {
  const amount = parseInventoryProductDecimal(value);

  if (!currency) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatInventoryProductQuantity(
  value: string | number,
  locale: string,
  decimalScale = 3,
) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.max(0, decimalScale),
  }).format(parseInventoryProductDecimal(value));
}

export function formatInventoryProductDateTime(
  value: string | null | undefined,
  locale: string,
) {
  if (!value) {
    return "No registrado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No registrado";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getInventoryProductTypeLabel(
  productType: InventoryProductType,
) {
  return productTypeLabels[productType];
}

export function getInventoryTrackingModeLabel(
  trackingMode: InventoryTrackingMode,
) {
  return trackingModeLabels[trackingMode];
}

export function getInventoryProductStatusLabel(product: InventoryProduct) {
  return product.is_active ? "Activo" : "Inactivo";
}

export function getInventoryProductStatusClass(product: InventoryProduct) {
  return product.is_active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-500";
}

export function getInventoryProductStockLabel(product: InventoryProduct) {
  return product.manages_stock
    ? "Administra existencias"
    : "No administra existencias";
}

export function getInventoryVariantLabel(
  variant: InventoryVariant | InventoryVariantSummary,
) {
  if (variant.name) {
    return variant.name;
  }

  return variant.is_default ? "Presentación estándar" : "Variante sin nombre";
}

export function getInventoryVariantUnitLabel(
  variant: InventoryVariant | InventoryVariantSummary,
) {
  const suffix = variant.stock_unit.symbol || variant.stock_unit.code;

  return `${variant.stock_unit.name} (${suffix})`;
}

export function getInventoryProductBrandModel(product: InventoryProduct) {
  const values = [product.brand, product.model].filter(Boolean);

  return values.length > 0 ? values.join(" · ") : "Sin marca ni modelo";
}

export function getInventoryProductTaxLabel(
  product: InventoryProduct,
  locale: string,
) {
  if (product.tax_exempt) {
    return "Exento";
  }

  if (product.tax_rate === null) {
    return "Sin tasa definida";
  }

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(parseInventoryProductDecimal(product.tax_rate))}%`;
}
