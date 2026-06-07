import type { ClientMetricCardProps } from "../config/clientsPageConfig";

export function ClientMetricCard({
  title,
  value,
  icon,
  accentClass,
  bgClass,
}: ClientMetricCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bgClass} text-base`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{title}</p>

          <p
            className={`mt-1 text-2xl font-semibold leading-none ${accentClass}`}
          >
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}
