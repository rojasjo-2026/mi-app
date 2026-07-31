"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleDollarSign,
  ListChecks,
  Scale,
} from "lucide-react";

import type { ComponentType } from "react";

import type { InventoryMovementMetricsData } from "../types";

import {
  formatInventoryMovementMoney,
  formatInventoryMovementQuantity,
} from "../utils/inventoryMovementUi";

type InventoryMovementMetricsProps = {
  metrics: InventoryMovementMetricsData;
  loading: boolean;
  locale: string;
  currency: string;
};

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  icon: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
};

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: MetricCardProps) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden={true} />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}

export default function InventoryMovementMetrics({
  metrics,
  loading,
  locale,
  currency,
}: InventoryMovementMetricsProps) {
  const netValue = metrics.valueIn - metrics.valueOut;

  const loadingValue = "—";

  return (
    <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Movimientos"
        value={
          loading
            ? loadingValue
            : new Intl.NumberFormat(locale).format(metrics.movements)
        }
        description="Registros encontrados con los filtros actuales."
        icon={ListChecks}
      />

      <MetricCard
        label="Unidades de entrada"
        value={
          loading
            ? loadingValue
            : formatInventoryMovementQuantity(metrics.quantityIn, locale)
        }
        description="Cantidad total ingresada en la página consultada."
        icon={ArrowDownToLine}
      />

      <MetricCard
        label="Unidades de salida"
        value={
          loading
            ? loadingValue
            : formatInventoryMovementQuantity(metrics.quantityOut, locale)
        }
        description="Cantidad total retirada en la página consultada."
        icon={ArrowUpFromLine}
      />

      <MetricCard
        label="Valor de entrada"
        value={
          loading
            ? loadingValue
            : formatInventoryMovementMoney(metrics.valueIn, locale, currency)
        }
        description="Valor acumulado de las entradas consultadas."
        icon={CircleDollarSign}
      />

      <MetricCard
        label="Balance de valor"
        value={
          loading
            ? loadingValue
            : formatInventoryMovementMoney(netValue, locale, currency)
        }
        description="Diferencia entre valores de entrada y salida."
        icon={Scale}
      />
    </section>
  );
}
