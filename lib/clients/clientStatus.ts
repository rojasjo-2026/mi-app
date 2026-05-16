export const CLIENT_STATUSES = [
  "ACTIVE",
  "PROSPECT",
  "ON_HOLD",
  "INACTIVE",
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_FILTERS = ["all", ...CLIENT_STATUSES] as const;

export type ClientStatusFilter = (typeof CLIENT_STATUS_FILTERS)[number];

export const CLIENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activo" },
  { value: "PROSPECT", label: "Prospecto" },
  { value: "ON_HOLD", label: "En espera" },
  { value: "INACTIVE", label: "Inactivo" },
] as const;

export function normalizeClientStatus(value: unknown): ClientStatus | null {
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue === "ACTIVE") {
    return "ACTIVE";
  }

  if (normalizedValue === "PROSPECT") {
    return "PROSPECT";
  }

  if (
    normalizedValue === "ON_HOLD" ||
    normalizedValue === "ON HOLD" ||
    normalizedValue === "ON-HOLD"
  ) {
    return "ON_HOLD";
  }

  if (normalizedValue === "INACTIVE") {
    return "INACTIVE";
  }

  return null;
}

export function normalizeClientStatusFilter(
  value: unknown,
): ClientStatusFilter {
  const normalizedValue = String(value ?? "all")
    .trim()
    .toUpperCase();

  if (normalizedValue === "ALL") {
    return "all";
  }

  const status = normalizeClientStatus(normalizedValue);

  return status ?? "all";
}

export function getClientStatusLabel(status?: unknown) {
  const normalizedStatus = normalizeClientStatus(status);

  switch (normalizedStatus) {
    case "PROSPECT":
      return "Prospecto";

    case "ON_HOLD":
      return "En espera";

    case "INACTIVE":
      return "Inactivo";

    case "ACTIVE":
    default:
      return "Activo";
  }
}

export function getClientStatusBadgeClass(status?: unknown) {
  const normalizedStatus = normalizeClientStatus(status);

  switch (normalizedStatus) {
    case "PROSPECT":
      return "border border-sky-200 bg-sky-50 text-sky-700";

    case "ON_HOLD":
      return "border border-amber-200 bg-amber-50 text-amber-700";

    case "INACTIVE":
      return "border border-slate-200 bg-slate-100 text-slate-700";

    case "ACTIVE":
    default:
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}
