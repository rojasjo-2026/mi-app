import { Boxes, CircleCheckBig, Layers3, Package, Tags } from "lucide-react";

import type { InventoryProductMetricsData } from "../types";

type InventoryProductMetricsProps = {
  metrics: InventoryProductMetricsData;
};

const metricClassName =
  "rounded-lg border border-slate-200 bg-white p-4 shadow-sm";

export default function InventoryProductMetrics({
  metrics,
}: InventoryProductMetricsProps) {
  return (
    <section
      aria-label="Resumen de productos"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      <article className={metricClassName}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">Productos</p>

          <Package className="h-4 w-4 text-blue-600" aria-hidden="true" />
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-950">
          {metrics.products}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Registros encontrados con los filtros actuales.
        </p>
      </article>

      <article className={metricClassName}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">Activos</p>

          <CircleCheckBig
            className="h-4 w-4 text-emerald-600"
            aria-hidden="true"
          />
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-950">
          {metrics.activeProducts}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Productos habilitados para utilizarse.
        </p>
      </article>

      <article className={metricClassName}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">
            Con existencias
          </p>

          <Boxes className="h-4 w-4 text-violet-600" aria-hidden="true" />
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-950">
          {metrics.stockProducts}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Productos que administran inventario.
        </p>
      </article>

      <article className={metricClassName}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">Variantes</p>

          <Layers3 className="h-4 w-4 text-amber-600" aria-hidden="true" />
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-950">
          {metrics.variants}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Presentaciones asociadas a los productos.
        </p>
      </article>

      <article className={metricClassName}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">Categorías</p>

          <Tags className="h-4 w-4 text-cyan-600" aria-hidden="true" />
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-950">
          {metrics.categories}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Categorías disponibles para clasificación.
        </p>
      </article>
    </section>
  );
}
