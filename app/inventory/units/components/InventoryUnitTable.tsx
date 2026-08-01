import { ChevronLeft, ChevronRight, Hash, Scale } from "lucide-react";

import type { InventoryUnitOfMeasure } from "../types";
import {
  formatInventoryUnitDateTime,
  getInventoryUnitPrecisionLabel,
  getInventoryUnitQuantityTypeLabel,
  getInventoryUnitStatusClass,
  getInventoryUnitStatusLabel,
  getInventoryUnitSymbolLabel,
} from "../utils/inventoryUnitUi";

type InventoryUnitTableProps = {
  items: InventoryUnitOfMeasure[];
  selectedUnitId: string | null;
  locale: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  loading: boolean;
  onSelect: (unitId: string) => void;
  onPageChange: (page: number) => void;
};

export default function InventoryUnitTable({
  items,
  selectedUnitId,
  locale,
  page,
  pageSize,
  totalItems,
  totalPages,
  loading,
  onSelect,
  onPageChange,
}: InventoryUnitTableProps) {
  const firstVisibleItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const lastVisibleItem = Math.min(page * pageSize, totalItems);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Unidad
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Símbolo
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Tipo de cantidad
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Precisión
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Estado
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Actualización
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((unit) => {
              const isSelected = selectedUnitId === unit.unit_of_measure_id;

              return (
                <tr
                  key={unit.unit_of_measure_id}
                  className={[
                    "transition",
                    isSelected ? "bg-blue-50/70" : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <td className="min-w-64 px-4 py-3.5 align-middle">
                    <button
                      type="button"
                      onClick={() => onSelect(unit.unit_of_measure_id)}
                      className="flex w-full cursor-pointer items-center gap-3 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                        <Scale className="h-4 w-4" aria-hidden="true" />
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900">
                          {unit.name}
                        </span>

                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                          {unit.code}
                        </span>
                      </span>
                    </button>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <span className="inline-flex min-w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-bold text-slate-700">
                      {getInventoryUnitSymbolLabel(unit)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center gap-2">
                      <Hash
                        className="h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        {getInventoryUnitQuantityTypeLabel(unit)}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <span className="text-sm font-semibold text-slate-700">
                      {getInventoryUnitPrecisionLabel(unit)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                        getInventoryUnitStatusClass(unit),
                      ].join(" ")}
                    >
                      {getInventoryUnitStatusLabel(unit)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5 align-middle text-sm font-medium text-slate-600">
                    {formatInventoryUnitDateTime(unit.updated_at, locale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Mostrando {firstVisibleItem}–{lastVisibleItem} de {totalItems}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            aria-label="Página anterior"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <span className="min-w-24 text-center text-xs font-bold text-slate-600">
            Página {page} de {Math.max(totalPages, 1)}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            aria-label="Página siguiente"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
