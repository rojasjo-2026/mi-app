import { Calculator, CircleCheckBig, Hash, Scale } from "lucide-react";

import type { InventoryUnitMetricsData } from "../types";

type InventoryUnitMetricsProps = {
  metrics: InventoryUnitMetricsData;
};

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  icon: typeof Scale;
};

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: MetricCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

export default function InventoryUnitMetrics({
  metrics,
}: InventoryUnitMetricsProps) {
  return (
    <section
      aria-label="Métricas de unidades"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MetricCard
        label="Unidades"
        value={metrics.units}
        description="Total visible según los filtros."
        icon={Scale}
      />

      <MetricCard
        label="Activas"
        value={metrics.activeUnits}
        description="Disponibles para productos y operaciones."
        icon={CircleCheckBig}
      />

      <MetricCard
        label="Con decimales"
        value={metrics.decimalUnits}
        description="Permiten registrar cantidades fraccionadas."
        icon={Calculator}
      />

      <MetricCard
        label="Cantidades enteras"
        value={metrics.integerUnits}
        description="Aceptan únicamente números completos."
        icon={Hash}
      />
    </section>
  );
}
