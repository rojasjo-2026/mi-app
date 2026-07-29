"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import type {
  InventoryReservationFilters,
  InventoryReservationStatus,
} from "../types";

const STATUS_OPTIONS: Array<{
  value: "ALL" | InventoryReservationStatus;
  label: string;
}> = [
  { value: "ALL", label: "Todos los estados" },
  { value: "DRAFT", label: "Borrador" },
  { value: "ACTIVE", label: "Activa" },
  { value: "PARTIALLY_CONSUMED", label: "Consumo parcial" },
  { value: "CONSUMED", label: "Consumida" },
  { value: "RELEASED", label: "Liberada" },
  { value: "EXPIRED", label: "Vencida" },
  { value: "CANCELLED", label: "Cancelada" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type InventoryReservationsFiltersProps = {
  search: string;
  filters: InventoryReservationFilters;
  resultText: string;
  clearDisabled: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: InventoryReservationFilters) => void;
  onClear: () => void;
};

export default function InventoryReservationsFilters({
  search,
  filters,
  resultText,
  clearDisabled,
  onSearchChange,
  onFiltersChange,
  onClear,
}: InventoryReservationsFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar reserva, referencia, producto o ubicacion..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 lg:flex">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
          </div>

          <select
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target
                  .value as InventoryReservationFilters["status"],
              })
            }
            className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.expiration}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                expiration: event.target
                  .value as InventoryReservationFilters["expiration"],
              })
            }
            className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="ANY">Cualquier vencimiento</option>

            <option value="UPCOMING">Proximas a vencer</option>

            <option value="OVERDUE">Vencidas</option>

            <option value="WITHOUT_DATE">Sin vencimiento</option>
          </select>

          <select
            value={filters.sort}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                sort: event.target.value as InventoryReservationFilters["sort"],
              })
            }
            className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="updated_desc">Actualizadas recientemente</option>

            <option value="created_desc">Mas recientes</option>

            <option value="created_asc">Mas antiguas</option>

            <option value="expires_asc">Vencimiento mas cercano</option>

            <option value="reservation_asc">Numero de reserva</option>
          </select>

          <select
            value={filters.pageSize}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                pageSize: Number(event.target.value),
              })
            }
            className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} por pagina
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onClear}
            disabled={clearDisabled}
            title="Limpiar filtros"
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-xs font-medium text-slate-400">{resultText}</p>
      </div>
    </section>
  );
}
