import { resolveAppSettings } from "@/lib/config/app-settings";
import type {
  AppSettingsResponse,
  ColumnKey,
  FollowUp,
  SortDirection,
  Technician,
} from "../types/followUpsPageTypes";

export function getBusinessCountryMeta(settings?: AppSettingsResponse["data"]) {
  const resolvedSettings = resolveAppSettings(settings);

  return {
    currency: resolvedSettings.currency,
    locale: resolvedSettings.locale,
  };
}

export function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

export function getStatusClasses(status?: string) {
  if (status === "completed") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "postponed") {
    return "border border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "confirmed") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border border-blue-200 bg-blue-50 text-blue-700";
}

export function getPriorityClasses(priority?: number | null) {
  if (priority === 1) {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (priority === 2) {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === 3) {
    return "border border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-600";
}

export function getPriorityLabel(priority?: number | null) {
  if (priority === 1) return "Alta";
  if (priority === 2) return "Media";
  if (priority === 3) return "Baja";

  return "Sin prioridad";
}

export function getBillingStatusLabel(status?: string | null) {
  switch (status) {
    case "PENDING":
      return "Pendiente de facturar";
    case "INVOICED":
      return "Facturado";
    case "PARTIALLY_PAID":
      return "Pago parcial";
    case "PAID":
      return "Pagado";
    case "NOT_BILLABLE":
      return "No facturable";
    case "BILLING_ERROR":
      return "Error de facturación";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Sin estado financiero";
  }
}

export function getBillingStatusClasses(status?: string | null) {
  switch (status) {
    case "PAID":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INVOICED":
      return "border border-blue-200 bg-blue-50 text-blue-700";
    case "PARTIALLY_PAID":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "NOT_BILLABLE":
      return "border border-slate-200 bg-slate-50 text-slate-600";
    case "BILLING_ERROR":
      return "border border-red-200 bg-red-50 text-red-700";
    case "CANCELLED":
      return "border border-slate-300 bg-slate-100 text-slate-700";
    default:
      return "border border-violet-200 bg-violet-50 text-violet-700";
  }
}

export function formatDateLabel(value?: string | null, locale?: string) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getDateOnly(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function getTimingMeta(targetDate?: string | null, status?: string) {
  if (status === "completed") {
    return {
      key: "closed",
      label: "Cerrado",
      classes: "border border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  const target = getDateOnly(targetDate);

  if (!target) {
    return {
      key: "unknown",
      label: "Sin fecha",
      classes: "border border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (target.getTime() < today.getTime()) {
    return {
      key: "overdue",
      label: "Atrasado",
      classes: "border border-red-200 bg-red-50 text-red-700",
    };
  }

  if (target.getTime() === today.getTime()) {
    return {
      key: "today",
      label: "Hoy",
      classes: "border border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    key: "upcoming",
    label: "Próximo",
    classes: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function getClientName(client?: FollowUp["client"]) {
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

export function getTechnicianName(technician?: Technician | null) {
  if (!technician) return "Sin técnico asignado";

  const composedName =
    technician.full_name ||
    technician.name ||
    [technician.first_name, technician.last_name].filter(Boolean).join(" ");

  return composedName?.trim() || technician.email || "Sin técnico asignado";
}

export function formatMaintenanceType(value?: string | null) {
  if (!value) return "Mantenimiento general";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function getMainAmount(item: FollowUp) {
  return toNumber(item.final_amount) ?? toNumber(item.estimated_amount);
}

export function formatMoney(value: unknown, currency: string, locale: string) {
  const amount = toNumber(value);

  if (amount === null) return "No definido";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  }
}

export function getSearchText(item: FollowUp) {
  return [
    getClientName(item.client),
    item.client?.phone_primary,
    item.reason,
    item.installation?.description,
    item.follow_up_status?.name,
    item.billing_status,
    getTechnicianName(item.technician),
    formatMaintenanceType(item.maintenance_type),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getDateTimeForSort(value?: string | null) {
  const parsed = new Date(value || "");

  if (Number.isNaN(parsed.getTime())) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsed.getTime();
}

export function compareText(a: string, b: string, direction: SortDirection) {
  const result = a.localeCompare(b, "es", {
    sensitivity: "base",
    numeric: true,
  });

  return direction === "asc" ? result : -result;
}

export function compareNumber(a: number, b: number, direction: SortDirection) {
  const result = a - b;

  return direction === "asc" ? result : -result;
}

export function getStickyHeaderClass(columnKey: ColumnKey) {
  if (columnKey === "maintenance") {
    return "sticky left-0 z-30 bg-slate-50 shadow-[8px_0_16px_-16px_rgba(15,23,42,0.45)]";
  }

  if (columnKey === "actions") {
    return "sticky right-0 z-30 bg-slate-50 shadow-[-8px_0_16px_-16px_rgba(15,23,42,0.45)]";
  }

  return "";
}

export function getStickyBodyClass(columnKey: ColumnKey, isSelected: boolean) {
  if (columnKey === "maintenance") {
    return [
      "sticky left-0 z-20 shadow-[8px_0_16px_-16px_rgba(15,23,42,0.45)]",
      isSelected ? "bg-blue-50" : "bg-white group-hover:bg-blue-50/70",
    ].join(" ");
  }

  if (columnKey === "actions") {
    return [
      "sticky right-0 z-20 shadow-[-8px_0_16px_-16px_rgba(15,23,42,0.45)]",
      isSelected ? "bg-blue-50" : "bg-white group-hover:bg-blue-50/70",
    ].join(" ");
  }

  return "";
}
