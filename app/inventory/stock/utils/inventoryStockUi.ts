import type { InventoryStockBalance } from "../types";

const INVENTORY_ENUM_LABELS: Record<string, string> = {
  STOCK_ITEM: "Producto con inventario",
  NON_STOCK_ITEM: "Producto sin inventario",
  SERVICE: "Servicio",
  NONE: "Sin seguimiento",
  LOT: "Por lote",
  SERIAL: "Por número de serie",
  WAREHOUSE: "Bodega",
  STORE: "Sucursal",
  VEHICLE: "Vehículo",
  TRANSIT: "En tránsito",
};

export function formatInventoryEnumLabel(value: string) {
  const normalizedValue = value.trim().toUpperCase();

  const configuredLabel = INVENTORY_ENUM_LABELS[normalizedValue];

  if (configuredLabel) {
    return configuredLabel;
  }

  return normalizedValue
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseInventoryDecimal(
  value: string | number | null | undefined,
) {
  const numberValue = typeof value === "number" ? value : Number(value ?? 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function formatInventoryStockQuantity(
  value: string | number,
  locale: string,
  decimalScale = 2,
) {
  const amount = parseInventoryDecimal(value);

  const safeScale = Math.min(Math.max(decimalScale, 0), 6);

  try {
    return new Intl.NumberFormat(locale || "es", {
      minimumFractionDigits: 0,
      maximumFractionDigits: safeScale,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("es", {
      minimumFractionDigits: 0,
      maximumFractionDigits: safeScale,
    }).format(amount);
  }
}

export function formatInventoryStockMoney(
  value: string | number,
  locale: string,
  currency: string,
) {
  const amount = parseInventoryDecimal(value);

  if (!currency) {
    return formatInventoryStockQuantity(amount, locale, 2);
  }

  try {
    return new Intl.NumberFormat(locale || "es", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return formatInventoryStockQuantity(amount, locale, 2);
  }
}

export function formatInventoryStockDateTime(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  try {
    return new Intl.DateTimeFormat(locale || "es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

export function getInventoryVariantLabel(balance: InventoryStockBalance) {
  return (
    balance.variant.name ||
    (balance.variant.is_default
      ? "Variante predeterminada"
      : "Sin nombre de variante")
  );
}

export function getInventoryUnitLabel(balance: InventoryStockBalance) {
  return balance.stock_unit.symbol || balance.stock_unit.code;
}

export function getInventoryAvailabilityTone(value: string | number) {
  const quantity = parseInventoryDecimal(value);

  if (quantity < 0) {
    return {
      textClassName: "text-red-700",
      backgroundClassName: "bg-red-50",
      borderClassName: "border-red-200",
    };
  }

  if (quantity === 0) {
    return {
      textClassName: "text-slate-600",
      backgroundClassName: "bg-slate-50",
      borderClassName: "border-slate-200",
    };
  }

  return {
    textClassName: "text-emerald-700",
    backgroundClassName: "bg-emerald-50",
    borderClassName: "border-emerald-200",
  };
}
