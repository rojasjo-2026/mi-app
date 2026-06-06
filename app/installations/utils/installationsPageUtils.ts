import { getCountryPreset } from "@/lib/settings/countryPresets";
import {
  fallbackCountryPreset,
  type AppSettingsResponse,
  type ColumnKey,
  type InstallationItem,
  type SortDirection,
} from "../config/installationsPageConfig";

export function getBusinessCountryMeta(settings?: AppSettingsResponse["data"]) {
  const countryPreset =
    getCountryPreset(settings?.country_code) ?? fallbackCountryPreset;

  return {
    currency: settings?.default_currency || countryPreset.primaryCurrency,
    locale: countryPreset.locale,
  };
}

export function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

export function getInstallationStatusLabel(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "OPEN") return "Abierta";
  if (normalized === "IN_PROGRESS") return "En proceso";
  if (normalized === "CLOSED") return "Completada";
  if (normalized === "CANCELLED") return "Cancelada";

  return status || "Sin estado";
}

export function getStatusBadgeClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "OPEN") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "IN_PROGRESS") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "CLOSED") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "CANCELLED") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

export function formatDateLabel(value?: string | null, locale = "es-CR") {
  if (!value) return "No disponible";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatCurrency(
  value?: number | null,
  currency = "CRC",
  locale = "es-CR",
) {
  if (value == null) return "No definido";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  }
}

export function getClientName(client?: InstallationItem["client"]) {
  const composedName = [
    client?.first_name,
    client?.last_name_1,
    client?.last_name_2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || "Cliente sin nombre";
}

export function getLocationLabel(item: InstallationItem) {
  const parts = [item.city, item.zone]
    .filter(Boolean)
    .map((value) => value!.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return item.address_line || "Ubicación no definida";
  }

  return parts.join(", ");
}

export function getInstallationCode(item: InstallationItem, index: number) {
  const shortId = item.installation_id?.slice(0, 4).toUpperCase() || "0000";
  return `INST-${String(index + 1).padStart(4, "0")}-${shortId}`;
}

export function getInitials(value: string) {
  const words = value.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "IN";

  const first = words[0]?.charAt(0) ?? "";
  const second = words[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}

export function getStickyHeaderClass(columnKey: ColumnKey) {
  if (columnKey === "installation") {
    return "sticky left-0 z-30 bg-slate-50 shadow-[8px_0_16px_-16px_rgba(15,23,42,0.45)]";
  }

  if (columnKey === "actions") {
    return "sticky right-0 z-30 bg-slate-50 shadow-[-8px_0_16px_-16px_rgba(15,23,42,0.45)]";
  }

  return "";
}

export function getStickyBodyClass(columnKey: ColumnKey) {
  if (columnKey === "installation") {
    return "sticky left-0 z-20 bg-white shadow-[8px_0_16px_-16px_rgba(15,23,42,0.45)] group-hover:bg-blue-50 group-data-[selected=true]:bg-blue-50";
  }

  if (columnKey === "actions") {
    return "sticky right-0 z-20 bg-white shadow-[-8px_0_16px_-16px_rgba(15,23,42,0.45)] group-hover:bg-blue-50 group-data-[selected=true]:bg-blue-50";
  }

  return "";
}

