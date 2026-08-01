"use client";

import {
  Boxes,
  CircleCheckBig,
  MapPin,
  Network,
  Warehouse,
} from "lucide-react";

import type { InventoryLocationMetricsData } from "../types";

type InventoryLocationMetricsProps = {
  metrics: InventoryLocationMetricsData;
  locale: string;
};

export default function InventoryLocationMetrics({
  metrics,
  locale,
}: InventoryLocationMetricsProps) {
  const cards = [
    {
      label: "Ubicaciones",
      value: metrics.locations,
      description: "Registros visibles",
      icon: MapPin,
    },
    {
      label: "Activas",
      value: metrics.activeLocations,
      description: "Disponibles para operar",
      icon: CircleCheckBig,
    },
    {
      label: "Con existencias",
      value: metrics.stockLocations,
      description: "Permiten almacenar productos",
      icon: Warehouse,
    },
    {
      label: "Principales",
      value: metrics.rootLocations,
      description: "Sin ubicación superior",
      icon: Network,
    },
    {
      label: "Balances",
      value: metrics.stockBalances,
      description: "Productos por ubicación",
      icon: Boxes,
    },
  ];

  return (
    <section
      aria-label="Resumen de ubicaciones"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {card.value.toLocaleString(locale)}
                </p>
              </div>

              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                <Icon className="size-4" />
              </div>
            </div>

            <p className="mt-2 text-xs font-medium text-slate-500">
              {card.description}
            </p>
          </article>
        );
      })}
    </section>
  );
}
