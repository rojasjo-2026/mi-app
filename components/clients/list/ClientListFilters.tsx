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
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          🔎
        </span>

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, teléfono, email o ubicación..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr_240px] xl:items-end">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
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
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
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

        <div>
          <label
            htmlFor="sort"
            className="mb-3 block text-xs font-black uppercase tracking-[0.22em] text-slate-400"
          >
            Ordenar por
          </label>

          <select
            id="sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortType)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="name">Nombre</option>
            <option value="recent">Más recientes</option>
          </select>
        </div>
      </div>
    </section>
  );
}
