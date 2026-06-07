"use client";

import type { ReactNode } from "react";

type StatusFilter = "all" | "ACTIVE" | "PROSPECT" | "ON_HOLD" | "INACTIVE";
type WhatsAppFilter = "all" | "with" | "without";
type SortType = "name" | "recent";

type ClientListFiltersProps = {
  search: string;
  statusFilter: StatusFilter;
  whatsFilter: WhatsAppFilter;
  sort: SortType;
  resultText?: string;
  rightContent?: ReactNode;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onWhatsFilterChange: (value: WhatsAppFilter) => void;
  onSortChange: (value: SortType) => void;
};

const controlClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

export function ClientListFilters({
  search,
  statusFilter,
  whatsFilter,
  sort,
  resultText,
  rightContent,
  onSearchChange,
  onStatusFilterChange,
  onWhatsFilterChange,
  onSortChange,
}: ClientListFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_150px_170px_160px_auto] xl:items-center">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            🔎
          </span>

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar clientes..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          className={controlClass}
        >
          <option value="all">Estado: Todos</option>
          <option value="ACTIVE">Estado: Activos</option>
          <option value="PROSPECT">Estado: Prospectos</option>
          <option value="ON_HOLD">Estado: En espera</option>
          <option value="INACTIVE">Estado: Inactivos</option>
        </select>

        <select
          value={whatsFilter}
          onChange={(e) =>
            onWhatsFilterChange(e.target.value as WhatsAppFilter)
          }
          className={controlClass}
        >
          <option value="all">WhatsApp: Todos</option>
          <option value="with">WhatsApp: Con WhatsApp</option>
          <option value="without">WhatsApp: Sin WhatsApp</option>
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortType)}
          className={controlClass}
        >
          <option value="name">Nombre</option>
          <option value="recent">Más recientes</option>
        </select>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {resultText && (
            <p className="whitespace-nowrap text-sm font-semibold text-slate-700">
              {resultText}
            </p>
          )}

          {rightContent}
        </div>
      </div>
    </section>
  );
}
