import { Filter, RotateCcw, Search } from "lucide-react";

import type { InventoryStockFilters } from "../types";

type InventoryStockFiltersProps = {
  search: string;
  filters: InventoryStockFilters;
  resultText: string;
  clearDisabled: boolean;

  onSearchChange: (value: string) => void;

  onFiltersChange: (filters: InventoryStockFilters) => void;

  onClear: () => void;
};

export default function InventoryStockFilters({
  search,
  filters,
  resultText,
  clearDisabled,
  onSearchChange,
  onFiltersChange,
  onClear,
}: InventoryStockFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar producto, variante, ubicación, código o unidad..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={filters.onlyWithStock}
            onClick={() =>
              onFiltersChange({
                ...filters,
                onlyWithStock: !filters.onlyWithStock,
              })
            }
            className={[
              "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
              filters.onlyWithStock
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Solo con existencia
          </button>

          <button
            type="button"
            aria-pressed={filters.includeInactive}
            onClick={() =>
              onFiltersChange({
                ...filters,
                includeInactive: !filters.includeInactive,
              })
            }
            className={[
              "inline-flex h-9 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
              filters.includeInactive
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            Incluir inactivos
          </button>

          <select
            value={filters.pageSize}
            onChange={(event) =>
              onFiltersChange({
                ...filters,

                pageSize: Number(event.target.value),
              })
            }
            aria-label="Resultados por página"
            className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value={25}>25 por página</option>

            <option value={50}>50 por página</option>

            <option value={100}>100 por página</option>
          </select>

          <button
            type="button"
            onClick={onClear}
            disabled={clearDisabled}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Limpiar
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs font-medium text-slate-400">{resultText}</p>
    </section>
  );
}
