import { Search, SlidersHorizontal, X } from "lucide-react";

import type {
  InventoryCategory,
  InventoryCategoryFilters as InventoryCategoryFiltersState,
} from "../types";

type InventoryCategoryFiltersProps = {
  search: string;
  filters: InventoryCategoryFiltersState;
  parentOptions: InventoryCategory[];
  resultCount: number;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: InventoryCategoryFiltersState) => void;
};

export default function InventoryCategoryFilters({
  search,
  filters,
  parentOptions,
  resultCount,
  loading,
  onSearchChange,
  onFiltersChange,
}: InventoryCategoryFiltersProps) {
  const hasFilters =
    Boolean(search) ||
    !filters.activeOnly ||
    filters.hierarchyMode !== "ALL" ||
    Boolean(filters.parentCategoryId) ||
    filters.pageSize !== 10;

  function updateFilters(values: Partial<InventoryCategoryFiltersState>) {
    onFiltersChange({
      ...filters,
      ...values,
    });
  }

  function resetFilters() {
    onSearchChange("");

    onFiltersChange({
      activeOnly: true,
      hierarchyMode: "ALL",
      parentCategoryId: "",
      pageSize: 10,
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="h-4 w-4 text-slate-500"
              aria-hidden="true"
            />

            <h2 className="text-sm font-bold text-slate-900">
              Filtros del catálogo
            </h2>

            {loading ? (
              <span className="text-xs font-medium text-slate-500">
                Actualizando…
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span>
              {resultCount}{" "}
              {resultCount === 1
                ? "categoría disponible"
                : "categorías disponibles"}
            </span>

            {hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(4,minmax(150px,1fr))]">
          <label className="relative block">
            <span className="sr-only">Buscar categorías</span>

            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nombre o código"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="sr-only">Filtrar por estado</span>

            <select
              value={filters.activeOnly ? "ACTIVE" : "ALL"}
              onChange={(event) =>
                updateFilters({
                  activeOnly: event.target.value === "ACTIVE",
                })
              }
              className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ACTIVE">Solo activas</option>

              <option value="ALL">Activas e inactivas</option>
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Filtrar por nivel</span>

            <select
              value={filters.hierarchyMode}
              onChange={(event) =>
                updateFilters({
                  hierarchyMode: event.target.value as "ALL" | "ROOT",
                  parentCategoryId: "",
                })
              }
              className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ALL">Todos los niveles</option>

              <option value="ROOT">Solo principales</option>
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Filtrar por categoría padre</span>

            <select
              value={filters.parentCategoryId}
              disabled={filters.hierarchyMode === "ROOT"}
              onChange={(event) =>
                updateFilters({
                  hierarchyMode: "ALL",
                  parentCategoryId: event.target.value,
                })
              }
              className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Cualquier categoría padre</option>

              {parentOptions.map((category) => (
                <option
                  key={category.inventory_category_id}
                  value={category.inventory_category_id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Filas por página</span>

            <select
              value={filters.pageSize}
              onChange={(event) =>
                updateFilters({
                  pageSize: Number(event.target.value),
                })
              }
              className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value={10}>10 por página</option>

              <option value={25}>25 por página</option>

              <option value={50}>50 por página</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
