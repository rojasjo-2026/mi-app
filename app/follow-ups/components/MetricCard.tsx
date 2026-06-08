import type { ReactNode } from "react";

export function MetricCard({
  title,
  value,
  detail,
  accentClass,
  bgClass,
  icon,
}: {
  title: string;
  value: number;
  detail: string;
  accentClass: string;
  bgClass: string;
  icon?: ReactNode;
}) {
  return (
    <article
      className={[
        "rounded-xl border px-4 py-4 shadow-sm transition hover:border-slate-300 hover:shadow-md",
        bgClass,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70 text-base">
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium opacity-80">{title}</p>

          <p
            className={`mt-1 text-2xl font-semibold leading-none ${accentClass}`}
          >
            {value}
          </p>

          <p className="mt-2 truncate text-xs font-medium opacity-80">
            {detail}
          </p>
        </div>
      </div>
    </article>
  );
}
