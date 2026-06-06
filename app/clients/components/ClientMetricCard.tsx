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
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${bgClass} text-lg`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-600">
            {title}
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className={`text-2xl font-black leading-none ${accentClass}`}>
              {value}
            </p>
            <span className="pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Clientes
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-1 text-sm font-medium text-slate-500">
        {detail}
      </p>
    </article>
  );
}

