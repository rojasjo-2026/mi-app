"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

import type { InventoryCategory, InventoryProductFilters } from "../types";

type InventoryProductFiltersProps = {
  search: string;
  filters: InventoryProductFilters;
  categories: InventoryCategory[];
  categoriesLoading: boolean;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: <K extends keyof InventoryProductFilters>(
    field: K,
    value: InventoryProductFilters[K],
  ) => void;
  onClear: () => void;
};

const productTypes = [
  ["ALL", "Todos los tipos"],
  ["STOCK_ITEM", "Artículo de inventario"],
  ["CONSUMABLE", "Consumible"],
  ["SPARE_PART", "Repuesto"],
  ["ASSET", "Activo"],
  ["RAW_MATERIAL", "Materia prima"],
  ["FINISHED_GOOD", "Producto terminado"],
  ["KIT", "Kit"],
  ["SERVICE", "Servicio"],
] as const;

const trackingModes = [
  ["ALL", "Todos los seguimientos"],
  ["NONE", "Sin seguimiento"],
  ["SERIAL", "Número de serie"],
  ["LOT", "Lote"],
] as const;

const controlClassName =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export default function InventoryProductFilters({
  search,
  filters,
  categories,
  categoriesLoading,
  resultCount,
  onSearchChange,
  onFilterChange,
  onClear,
}: InventoryProductFiltersProps) {
  const hasFilters =
    Boolean(search) ||
    !filters.activeOnly ||
    Boolean(filters.categoryId) ||
    filters.productType !== "ALL" ||
    filters.trackingMode !== "ALL" ||
    filters.managesStock !== "ALL" ||
    Boolean(filters.brand);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            className="h-4 w-4 text-slate-500"
            aria-hidden="true"
          />

          <h2 className="text-sm font-bold text-slate-900">Buscar y filtrar</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-medium text-slate-500">
            {resultCount}{" "}
            {resultCount === 1
              ? "producto disponible"
              : "productos disponibles"}
          </p>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasFilters}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block xl:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Buscar
          </span>

          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Nombre, marca, modelo o descripción"
              className={`${controlClassName} pl-9`}
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Estado
          </span>

          <select
            value={filters.activeOnly ? "ACTIVE" : "ALL"}
            onChange={(event) =>
              onFilterChange("activeOnly", event.target.value === "ACTIVE")
            }
            className={`${controlClassName} cursor-pointer`}
          >
            <option value="ACTIVE">Solo activos</option>

            <option value="ALL">Activos e inactivos</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Categoría
          </span>

          <select
            value={filters.categoryId}
            onChange={(event) =>
              onFilterChange("categoryId", event.target.value)
            }
            disabled={categoriesLoading}
            className={`${controlClassName} cursor-pointer disabled:cursor-not-allowed`}
          >
            <option value="">Todas las categorías</option>

            {categories.map((category) => (
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
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Tipo de producto
          </span>

          <select
            value={filters.productType}
            onChange={(event) =>
              onFilterChange("productType", event.target.value)
            }
            className={`${controlClassName} cursor-pointer`}
          >
            {productTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Seguimiento
          </span>

          <select
            value={filters.trackingMode}
            onChange={(event) =>
              onFilterChange("trackingMode", event.target.value)
            }
            className={`${controlClassName} cursor-pointer`}
          >
            {trackingModes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Administración
          </span>

          <select
            value={filters.managesStock}
            onChange={(event) =>
              onFilterChange(
                "managesStock",
                event.target.value as InventoryProductFilters["managesStock"],
              )
            }
            className={`${controlClassName} cursor-pointer`}
          >
            <option value="ALL">Todos</option>
            <option value="YES">Administra existencias</option>
            <option value="NO">No administra existencias</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Marca
          </span>

          <input
            type="text"
            value={filters.brand}
            onChange={(event) => onFilterChange("brand", event.target.value)}
            placeholder="Filtrar por marca"
            className={controlClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Por página
          </span>

          <select
            value={filters.pageSize}
            onChange={(event) =>
              onFilterChange("pageSize", Number(event.target.value))
            }
            className={`${controlClassName} cursor-pointer`}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>
    </section>
  );
}
