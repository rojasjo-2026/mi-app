"use client";

import type { FilterType } from "../types";

export type ContactStatusFilter = FilterType | "active" | "archived";

type ContactFlowMetrics = {
  all: number;
  unread: number;
  waiting: number;
  confirmed: number;
  manual: number;
};

type ContactAttemptsMetricsProps = {
  metrics: ContactFlowMetrics;
  selectedFilter: ContactStatusFilter;
  onFilterChange: (filter: ContactStatusFilter) => void;
};

function getCardClass(active: boolean) {
  return [
    "rounded-xl border px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md",
    active
      ? "border-blue-200 bg-blue-50"
      : "border-slate-200 bg-white hover:bg-slate-50",
  ].join(" ");
}

export function ContactAttemptsMetrics({
  metrics,
  selectedFilter,
  onFilterChange,
}: ContactAttemptsMetricsProps) {
  const cards: {
    key: ContactStatusFilter;
    title: string;
    value: number;
    detail: string;
    icon: string;
  }[] = [
    {
      key: "active",
      title: "Activos",
      value: metrics.all,
      detail: "Visibles por defecto",
      icon: "💬",
    },
    {
      key: "unread",
      title: "Sin leer",
      value: metrics.unread,
      detail: "Mensajes nuevos",
      icon: "✉️",
    },
    {
      key: "waiting",
      title: "En gestión",
      value: metrics.waiting,
      detail: "Conversaciones abiertas",
      icon: "🔄",
    },
    {
      key: "confirmed",
      title: "Confirmados",
      value: metrics.confirmed,
      detail: "Trabajo coordinado",
      icon: "✅",
    },
    {
      key: "manual",
      title: "Manual",
      value: metrics.manual,
      detail: "Requieren revisión",
      icon: "👤",
    },
    {
      key: "archived",
      title: "Archivados",
      value: 0,
      detail: "Preparado para backend",
      icon: "🗄️",
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const active = selectedFilter === card.key;

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onFilterChange(card.key)}
            className={getCardClass(active)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-base">
                {card.icon}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-600">
                  {card.title}
                </p>

                <p className="mt-1 text-2xl font-semibold leading-none text-slate-950">
                  {card.value}
                </p>

                <p className="mt-2 truncate text-xs font-medium text-slate-500">
                  {card.detail}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
