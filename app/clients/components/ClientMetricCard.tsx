import type { ClientMetricCardProps } from "../config/clientsPageConfig";

export function ClientMetricCard({
  title,
  value,
  detail,
  icon,
  accentClass,
  bgClass,
}: ClientMetricCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${bgClass} text-lg`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-600">{title}</p>

          <p
            className={`mt-1 text-2xl font-semibold leading-none ${accentClass}`}
          >
            {value}
          </p>

          <p className="mt-2 truncate text-xs font-medium text-slate-500">
            {detail}
          </p>
        </div>
      </div>
    </article>
  );
}
