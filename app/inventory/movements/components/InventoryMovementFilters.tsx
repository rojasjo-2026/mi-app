"use client";

import { CalendarRange, Search, SlidersHorizontal, X } from "lucide-react";

import type { InventoryMovementFilters as InventoryMovementFiltersState } from "../types";

type InventoryMovementFiltersProps = {
  search: string;
  filters: InventoryMovementFiltersState;
  resultText: string;
  clearDisabled: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: InventoryMovementFiltersState) => void;
  onClear: () => void;
};

const movementTypeOptions = [
  {
    value: "ALL",
    label: "Todos los movimientos",
  },
  {
    value: "INBOUND",
    label: "Entradas",
  },
  {
    value: "OUTBOUND",
    label: "Salidas",
  },
  {
    value: "TRANSFER_RECEIPT",
    label: "Transferencias recibidas",
  },
  {
    value: "TRANSFER_DISPATCH",
    label: "Transferencias despachadas",
  },
  {
    value: "ADJUSTMENT_IN",
    label: "Ajustes positivos",
  },
  {
    value: "ADJUSTMENT_OUT",
    label: "Ajustes negativos",
  },
  {
    value: "REVERSAL",
    label: "Reversiones",
  },
];

const pageSizeOptions = [25, 50, 100];

export default function InventoryMovementFilters({
  search,
  filters,
  resultText,
  clearDisabled,
  onSearchChange,
  onFiltersChange,
  onClear,
}: InventoryMovementFiltersProps) {
  function updateFilter<K extends keyof InventoryMovementFiltersState>(
    field: K,
    value: InventoryMovementFiltersState[K],
  ) {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="inventory-movement-search"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Buscar
            </label>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                id="inventory-movement-search"
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Producto, operación, referencia o ubicación"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="w-full xl:w-60">
            <label
              htmlFor="inventory-movement-type"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Tipo de movimiento
            </label>

            <select
              id="inventory-movement-type"
              value={filters.movementType}
              onChange={(event) =>
                updateFilter("movementType", event.target.value)
              }
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              {movementTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full xl:w-44">
            <label
              htmlFor="inventory-movement-date-from"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Desde
            </label>

            <div className="relative">
              <CalendarRange
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                id="inventory-movement-date-from"
                type="date"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(event) =>
                  updateFilter("dateFrom", event.target.value)
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="w-full xl:w-44">
            <label
              htmlFor="inventory-movement-date-to"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Hasta
            </label>

            <div className="relative">
              <CalendarRange
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                id="inventory-movement-date-to"
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="w-full xl:w-36">
            <label
              htmlFor="inventory-movement-page-size"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Por página
            </label>

            <select
              id="inventory-movement-page-size"
              value={filters.pageSize}
              onChange={(event) =>
                updateFilter("pageSize", Number(event.target.value))
              }
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
            <SlidersHorizontal
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />

            <span className="truncate">{resultText}</span>
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={clearDisabled}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>
  );
}
