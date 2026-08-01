"use client";

import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  MapPin,
  Network,
  Star,
  Warehouse,
} from "lucide-react";

import {
  getInventoryLocationBalancesLabel,
  getInventoryLocationStatusClass,
  getInventoryLocationStatusLabel,
  getInventoryLocationTypeLabel,
  type InventoryLocationTreeItem,
} from "../utils/inventoryLocationUi";

type InventoryLocationTableProps = {
  items: InventoryLocationTreeItem[];
  selectedLocationId: string | null;
  page: number;
  pageSize: number;
  totalItems: number;
  onSelect: (locationId: string) => void;
  onPageChange: (page: number) => void;
};

export default function InventoryLocationTable({
  items,
  selectedLocationId,
  page,
  pageSize,
  totalItems,
  onSelect,
  onPageChange,
}: InventoryLocationTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const firstVisible = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const lastVisible = Math.min(page * pageSize, totalItems);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Network className="size-4 text-slate-500" />

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Estructura de ubicaciones
            </h2>

            <p className="text-xs text-slate-500">
              Seleccioná una fila para consultar su detalle.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Ubicación
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Tipo
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Configuración
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Relaciones
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Estado
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((location) => {
              const isSelected =
                selectedLocationId === location.inventory_location_id;

              return (
                <tr
                  key={location.inventory_location_id}
                  aria-current={isSelected ? "true" : undefined}
                  className={[
                    "cursor-pointer transition",
                    isSelected ? "bg-blue-50" : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                  onClick={() => onSelect(location.inventory_location_id)}
                >
                  <td className="px-4 py-3">
                    <div
                      className="flex min-w-0 items-start gap-2"
                      style={{
                        paddingLeft: `${location.depth * 20}px`,
                      }}
                    >
                      {location.depth > 0 ? (
                        <CornerDownRight className="mt-0.5 size-4 shrink-0 text-slate-400" />
                      ) : (
                        <MapPin className="mt-0.5 size-4 shrink-0 text-blue-600" />
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words text-sm font-bold text-slate-900">
                            {location.name}
                          </p>

                          {location.is_default ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                              <Star className="size-3" />
                              Predeterminada
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {location.location_code}
                        </p>

                        {location.parent ? (
                          <p className="mt-1 text-xs text-slate-400">
                            Dentro de {location.parent.name}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">
                            Ubicación principal
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {getInventoryLocationTypeLabel(location.location_type)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Warehouse className="size-3.5 text-slate-400" />
                        {location.allows_stock
                          ? "Permite existencias"
                          : "No almacena existencias"}
                      </p>

                      <p className="text-xs text-slate-500">
                        Orden {location.sort_order}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Network className="size-3.5 text-slate-400" />
                        {location.children_count === 1
                          ? "1 ubicación secundaria"
                          : `${location.children_count} ubicaciones secundarias`}
                      </p>

                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Boxes className="size-3.5 text-slate-400" />
                        {getInventoryLocationBalancesLabel(
                          location.stock_balances_count,
                        )}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                        getInventoryLocationStatusClass(location),
                      ].join(" ")}
                    >
                      {getInventoryLocationStatusLabel(location)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-500">
          Mostrando {firstVisible}–{lastVisible} de {totalItems}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="min-w-24 text-center text-sm font-bold text-slate-700">
            Página {page} de {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </section>
  );
}
