export function getClientFullName(client: {
  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
}) {
  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export function getLocationLabel(client: {
  admin_level_1?: string | null;
  admin_level_2?: string | null;
}) {
  const province = client.admin_level_1?.trim();
  const canton = client.admin_level_2?.trim();

  if (province && canton) return `${province}, ${canton}`;
  if (province) return province;
  if (canton) return canton;

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

export function formatDateLabel(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
