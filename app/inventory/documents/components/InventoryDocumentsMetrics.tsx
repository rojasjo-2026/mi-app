import { CircleDashed, CircleDollarSign, FileText, Truck } from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { InventoryDocumentMetrics } from "../types";

import { formatInventoryDocumentMoney } from "../utils/inventoryDocumentUi";

type InventoryDocumentsMetricsProps = {
  metrics: InventoryDocumentMetrics;
  loading: boolean;
  locale: string;
  currency: string;
};

type MetricCardProps = {
  title: string;
  value: string;
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
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 truncate text-2xl font-semibold leading-none tabular-nums text-slate-950">
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

export default function InventoryDocumentsMetrics({
  metrics,
  loading,
  locale,
  currency,
}: InventoryDocumentsMetricsProps) {
  return (
    <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Operaciones"
        value={String(metrics.total)}
        detail="Total según los filtros"
        icon={FileText}
        iconClassName="text-blue-700"
        iconBackgroundClassName="bg-blue-50"
        loading={loading}
      />

      <MetricCard
        title="Borradores visibles"
        value={String(metrics.drafts)}
        detail="Borradores de la página actual"
        icon={CircleDashed}
        iconClassName="text-slate-700"
        iconBackgroundClassName="bg-slate-100"
        loading={loading}
      />

      <MetricCard
        title="Transferencias visibles"
        value={String(metrics.inTransit)}
        detail="Resultados de la página actual"
        icon={Truck}
        iconClassName="text-amber-700"
        iconBackgroundClassName="bg-amber-50"
        loading={loading}
      />

      <MetricCard
        title="Valor visible"
        value={formatInventoryDocumentMoney(
          metrics.totalValue,
          locale,
          currency,
        )}
        detail="Suma de los resultados"
        icon={CircleDollarSign}
        iconClassName="text-emerald-700"
        iconBackgroundClassName="bg-emerald-50"
        loading={loading}
      />
    </section>
  );
}
