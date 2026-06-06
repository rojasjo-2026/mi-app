import { getCountryPreset } from "@/lib/settings/countryPresets";
import type { PendingBillable } from "../../types";
import { toSafeNumber } from "../../utils";
import {
  COLUMN_CLASSES,
  fallbackCountryPreset,
  type AppSettingsResponse,
  type ColumnKey,
} from "./pendingBillablesSectionConfig";

export function getBusinessCountryMeta(settings?: AppSettingsResponse["data"]) {
  const countryPreset =
    getCountryPreset(settings?.country_code) ?? fallbackCountryPreset;

  return {
    currency: settings?.default_currency || countryPreset.primaryCurrency,
    locale: countryPreset.locale,
  };
}

export function getItemAmount(item: PendingBillable) {
  return toSafeNumber(item.final_amount) > 0
    ? toSafeNumber(item.final_amount)
    : toSafeNumber(item.estimated_amount);
}

export function getItemProfit(item: PendingBillable) {
  return getItemAmount(item) - toSafeNumber(item.cost_amount);
}

export function getTypeLabel(item: PendingBillable) {
  return (
    item.source_label ||
    (item.type === "INSTALLATION" ? "Instalación" : "Mantenimiento")
  );
}

export function getGridTemplate(columns: ColumnKey[]) {
  return columns.map((column) => COLUMN_CLASSES[column]).join(" ");
}

