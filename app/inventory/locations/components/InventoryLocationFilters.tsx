"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import type {
  InventoryLocation,
  InventoryLocationFilters as InventoryLocationFiltersState,
} from "../types";
import { INVENTORY_LOCATION_TYPE_OPTIONS } from "../utils/inventoryLocationUi";

type InventoryLocationFiltersProps = {
  search: string;
  filters: InventoryLocationFiltersState;
  parentOptions: InventoryLocation[];
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: InventoryLocationFiltersState) => void;
  onReset: () => void;
};

export default function InventoryLocationFilters({
  search,
  filters,
  parentOptions,
  onSearchChange,
  onFiltersChange,
  onReset,
}: InventoryLocationFiltersProps) {
  function updateFilter<Field extends keyof InventoryLocationFiltersState>(
    field: Field,
    value: InventoryLocationFiltersState[Field],
  ) {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
              <SlidersHorizontal className="size-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Búsqueda y filtros
              </h2>

              <p className="text-xs text-slate-500">
                Refiná las ubicaciones visibles.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 lg:self-auto"
          >
            <RotateCcw className="size-4" />
            Restablecer
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="md:col-span-2 xl:col-span-2">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Buscar
            </span>

            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Código, nombre, descripción o dirección"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Estado
            </span>

            <select
              value={filters.activeOnly ? "ACTIVE" : "ALL"}
              onChange={(event) =>
                updateFilter("activeOnly", event.target.value === "ACTIVE")
              }
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ACTIVE">Solo activas</option>
              <option value="ALL">Activas e inactivas</option>
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Tipo
            </span>

            <select
              value={filters.locationType}
              onChange={(event) =>
                updateFilter(
                  "locationType",
                  event.target
                    .value as InventoryLocationFiltersState["locationType"],
                )
              }
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ALL">Todos los tipos</option>

              {INVENTORY_LOCATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Jerarquía
            </span>

            <select
              value={filters.hierarchyMode}
              onChange={(event) => {
                const hierarchyMode = event.target
                  .value as InventoryLocationFiltersState["hierarchyMode"];

                onFiltersChange({
                  ...filters,
                  hierarchyMode,
                  parentLocationId:
                    hierarchyMode === "ROOT" ? "" : filters.parentLocationId,
                });
              }}
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ALL">Toda la jerarquía</option>
              <option value="ROOT">Solo principales</option>
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Ubicación padre
            </span>

            <select
              value={filters.parentLocationId}
              disabled={filters.hierarchyMode === "ROOT"}
              onChange={(event) =>
                updateFilter("parentLocationId", event.target.value)
              }
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Cualquier ubicación padre</option>

              {parentOptions.map((location) => (
                <option
                  key={location.inventory_location_id}
                  value={location.inventory_location_id}
                >
                  {location.name} · {location.location_code}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Almacenamiento
            </span>

            <select
              value={filters.stockMode}
              onChange={(event) =>
                updateFilter(
                  "stockMode",
                  event.target
                    .value as InventoryLocationFiltersState["stockMode"],
                )
              }
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ALL">Todas</option>
              <option value="ALLOWS_STOCK">Permiten existencias</option>
              <option value="NO_STOCK">No almacenan existencias</option>
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Predeterminada
            </span>

            <select
              value={filters.defaultMode}
              onChange={(event) =>
                updateFilter(
                  "defaultMode",
                  event.target
                    .value as InventoryLocationFiltersState["defaultMode"],
                )
              }
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ALL">Todas</option>
              <option value="DEFAULT">Solo predeterminada</option>
              <option value="NOT_DEFAULT">No predeterminadas</option>
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Filas por página
            </span>

            <select
              value={String(filters.pageSize)}
              onChange={(event) =>
                updateFilter("pageSize", Number(event.target.value))
              }
              className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
