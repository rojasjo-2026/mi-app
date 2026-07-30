import { Boxes, LockKeyhole, PackageCheck, PackageOpen } from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { InventoryStockMetricsData } from "../types";

import { formatInventoryStockQuantity } from "../utils/inventoryStockUi";

type InventoryStockMetricsProps = {
  metrics: InventoryStockMetricsData;
  loading: boolean;
  locale: string;
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
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-100" />
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

export default function InventoryStockMetrics({
  metrics,
  loading,
  locale,
}: InventoryStockMetricsProps) {
  return (
    <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Balances"
        value={formatInventoryStockQuantity(metrics.balances, locale, 0)}
        detail="Total según los filtros"
        icon={Boxes}
        iconClassName="text-blue-700"
        iconBackgroundClassName="bg-blue-50"
        loading={loading}
      />

      <MetricCard
        title="Existencia visible"
        value={formatInventoryStockQuantity(metrics.quantityOnHand, locale, 2)}
        detail="Suma de la página actual"
        icon={PackageOpen}
        iconClassName="text-slate-700"
        iconBackgroundClassName="bg-slate-100"
        loading={loading}
      />

      <MetricCard
        title="Comprometido visible"
        value={formatInventoryStockQuantity(
          metrics.quantityReserved,
          locale,
          2,
        )}
        detail="Reservado en la página actual"
        icon={LockKeyhole}
        iconClassName="text-amber-700"
        iconBackgroundClassName="bg-amber-50"
        loading={loading}
      />

      <MetricCard
        title="Disponible visible"
        value={formatInventoryStockQuantity(
          metrics.quantityAvailable,
          locale,
          2,
        )}
        detail="Disponible en la página actual"
        icon={PackageCheck}
        iconClassName="text-emerald-700"
        iconBackgroundClassName="bg-emerald-50"
        loading={loading}
      />
    </section>
  );
}
