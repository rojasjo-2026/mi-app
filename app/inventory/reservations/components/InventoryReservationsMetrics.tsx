import { AlertTriangle, Boxes, CircleDashed, Clock3 } from "lucide-react";

import type { LucideIcon } from "lucide-react";

type InventoryReservationsMetricsProps = {
  metrics: {
    operational: number;
    drafts: number;
    upcoming: number;
    overdue: number;
  };

  loading: boolean;
};

type MetricCardProps = {
  title: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  iconClassName: string;
  iconBackgroundClassName: string;
  loading: boolean;
};

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  iconClassName,
  iconBackgroundClassName,
  loading,
}: MetricCardProps) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-500">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-7 w-12 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 text-2xl font-semibold leading-none tabular-nums text-slate-950">
              {value}
            </p>
          )}
        </div>

        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            iconBackgroundClassName,
          ].join(" ")}
        >
          <Icon
            className={["h-4 w-4", iconClassName].join(" ")}
            aria-hidden="true"
          />
        </div>
      </div>

      <p className="mt-2 truncate text-xs text-slate-400">{detail}</p>
    </article>
  );
}

export default function InventoryReservationsMetrics({
  metrics,
  loading,
}: InventoryReservationsMetricsProps) {
  return (
    <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Reservas operativas"
        value={metrics.operational}
        detail="Activas o con consumo parcial"
        icon={Boxes}
        iconClassName="text-blue-700"
        iconBackgroundClassName="bg-blue-50"
        loading={loading}
      />

      <MetricCard
        title="Borradores"
        value={metrics.drafts}
        detail="Aún no comprometen existencias"
        icon={CircleDashed}
        iconClassName="text-slate-600"
        iconBackgroundClassName="bg-slate-100"
        loading={loading}
      />

      <MetricCard
        title="Próximas a vencer"
        value={metrics.upcoming}
        detail="Vencen durante los siguientes 7 días"
        icon={Clock3}
        iconClassName="text-amber-700"
        iconBackgroundClassName="bg-amber-50"
        loading={loading}
      />

      <MetricCard
        title="Vencidas"
        value={metrics.overdue}
        detail="Requieren revisión operativa"
        icon={AlertTriangle}
        iconClassName="text-red-700"
        iconBackgroundClassName="bg-red-50"
        loading={loading}
      />
    </section>
  );
}
