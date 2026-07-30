import type { InventoryCatalogVariantSummary } from "./inventoryDraftLines.types";

export function formatQuantity(value: string, locale: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return value;
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 6,
  }).format(parsedValue);
}

export function getDecimalPlaces(value: string) {
  const normalizedValue = value.trim();

  const decimalPart = normalizedValue.split(".")[1];

  return decimalPart?.length ?? 0;
}

export function getVariantLabel(variant: InventoryCatalogVariantSummary) {
  return (
    variant.name?.trim() ||
    (variant.is_default ? "Variante principal" : "Variante sin nombre")
  );
}
