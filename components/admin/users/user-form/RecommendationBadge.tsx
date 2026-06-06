import type { PermissionItem } from "./userFormConfig";

export function RecommendationBadge({
  value,
}: {
  value: PermissionItem["recommendation"];
}) {
  const className =
    value === "Recomendado"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value === "Opcional"
        ? "bg-sky-50 text-sky-700 ring-sky-200"
        : value === "No recomendado"
          ? "bg-slate-50 text-slate-600 ring-slate-200"
          : value === "Sensible"
            ? "bg-amber-50 text-amber-700 ring-amber-200"
            : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}
    >
      {value}
    </span>
  );
}

