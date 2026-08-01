import { CircleCheckBig, GitBranch, PackageSearch, Tags } from "lucide-react";

import type { InventoryCategoryMetricsData } from "../types";

type InventoryCategoryMetricsProps = {
  metrics: InventoryCategoryMetricsData;
};

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  icon: typeof Tags;
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
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

export default function InventoryCategoryMetrics({
  metrics,
}: InventoryCategoryMetricsProps) {
  return (
    <section
      aria-label="Métricas de categorías"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      <MetricCard
        label="Categorías"
        value={metrics.categories}
        description="Total visible según los filtros."
        icon={Tags}
      />

      <MetricCard
        label="Activas"
        value={metrics.activeCategories}
        description="Disponibles para clasificar productos."
        icon={CircleCheckBig}
      />

      <MetricCard
        label="Principales"
        value={metrics.rootCategories}
        description="Categorías sin una categoría padre."
        icon={GitBranch}
      />

      <MetricCard
        label="Subcategorías"
        value={metrics.subcategories}
        description="Categorías organizadas bajo otra."
        icon={GitBranch}
      />

      <MetricCard
        label="Productos asignados"
        value={metrics.assignedProducts}
        description="Productos vinculados a las categorías visibles."
        icon={PackageSearch}
      />
    </section>
  );
}
