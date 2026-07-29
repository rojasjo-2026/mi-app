import {
  AlertTriangle,
  CircleDashed,
  Clock3,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";

import type { InventoryReservationMetrics } from "../types";

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
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {loading ? (
            <div className="mt-2 h-7 w-14 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {value}
            </p>
          )}

          <p className="mt-1 truncate text-xs font-medium text-slate-400">
            {detail}
          </p>
        </div>

        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            iconBackgroundClassName,
            iconClassName,
          ].join(" ")}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

type InventoryReservationsMetricsProps = {
  metrics: InventoryReservationMetrics;
  loading: boolean;
};

export default function InventoryReservationsMetrics({
  metrics,
  loading,
}: InventoryReservationsMetricsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Reservas operativas"
        value={metrics.operational}
        detail="Activas o con consumo parcial"
        icon={PackageCheck}
        iconClassName="text-blue-700"
        iconBackgroundClassName="bg-blue-50"
        loading={loading}
      />

      <MetricCard
        title="Borradores"
        value={metrics.drafts}
        detail="Aun no comprometen existencias"
        icon={CircleDashed}
        iconClassName="text-slate-700"
        iconBackgroundClassName="bg-slate-100"
        loading={loading}
      />

      <MetricCard
        title="Proximas a vencer"
        value={metrics.upcoming}
        detail="Vencen durante los siguientes 7 dias"
        icon={Clock3}
        iconClassName="text-amber-700"
        iconBackgroundClassName="bg-amber-50"
        loading={loading}
      />

      <MetricCard
        title="Vencidas"
        value={metrics.overdue}
        detail="Requieren revision operativa"
        icon={AlertTriangle}
        iconClassName="text-red-700"
        iconBackgroundClassName="bg-red-50"
        loading={loading}
      />
    </section>
  );
}
