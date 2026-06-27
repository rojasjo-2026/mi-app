export function getClientFullName(client: {
  display_name?: string | null;
  commercial_name?: string | null;
  company_name?: string | null;
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
}) {
  const preferredName =
    client.display_name?.trim() ||
    client.commercial_name?.trim() ||
    client.company_name?.trim();

  if (preferredName) {
    return preferredName;
  }

  return [client.first_name, client.last_name_1, client.last_name_2]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
}

export function getLocationLabel(client: {
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  country_code?: string | null;
}) {
  const adminLevel1 = client.admin_level_1?.trim();
  const adminLevel2 = client.admin_level_2?.trim();
  const adminLevel3 = client.admin_level_3?.trim();

  const locationParts = [adminLevel1, adminLevel2, adminLevel3].filter(Boolean);

  if (locationParts.length > 0) {
    return locationParts.join(", ");
  }

  return null;
}

export function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

export function getToastClass(type: "success" | "error") {
  return type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";
}

export function formatDateLabel(value?: string | null, locale = "es") {
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
