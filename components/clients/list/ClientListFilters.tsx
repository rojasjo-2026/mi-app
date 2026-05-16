"use client";

import { getFilterButtonClass } from "@/lib/clients/clientList.utils";

type StatusFilter = "all" | "ACTIVE" | "PROSPECT" | "ON_HOLD" | "INACTIVE";
type WhatsAppFilter = "all" | "with" | "without";
type SortType = "name" | "recent";

type ClientListFiltersProps = {
  search: string;
  statusFilter: StatusFilter;
  whatsFilter: WhatsAppFilter;
  sort: SortType;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onWhatsFilterChange: (value: WhatsAppFilter) => void;
  onSortChange: (value: SortType) => void;
};

export function ClientListFilters({
  search,
  statusFilter,
  whatsFilter,
  sort,
  onSearchChange,
  onStatusFilterChange,
  onWhatsFilterChange,
  onSortChange,
}: ClientListFiltersProps) {
  return (
    <div className="space-y-5">
      <div>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar cliente por nombre, teléfono, email o ubicación..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Estado
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={getFilterButtonClass(statusFilter === "all")}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("ACTIVE")}
              className={getFilterButtonClass(statusFilter === "ACTIVE")}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("PROSPECT")}
              className={getFilterButtonClass(statusFilter === "PROSPECT")}
            >
              Prospectos
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("ON_HOLD")}
              className={getFilterButtonClass(statusFilter === "ON_HOLD")}
            >
              En espera
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("INACTIVE")}
              className={getFilterButtonClass(statusFilter === "INACTIVE")}
            >
              Inactivos
            </button>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            WhatsApp
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onWhatsFilterChange("all")}
              className={getFilterButtonClass(whatsFilter === "all")}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onWhatsFilterChange("with")}
              className={getFilterButtonClass(whatsFilter === "with")}
            >
              Con WhatsApp
            </button>
            <button
              type="button"
              onClick={() => onWhatsFilterChange("without")}
              className={getFilterButtonClass(whatsFilter === "without")}
            >
              Sin WhatsApp
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-[220px]">
          <label
            htmlFor="sort"
            className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"
          >
            Ordenar por
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortType)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="name">Nombre</option>
            <option value="recent">Más recientes</option>
          </select>
        </div>
      </div>
    </div>
  );
}
