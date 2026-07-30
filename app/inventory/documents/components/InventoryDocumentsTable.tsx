import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
} from "lucide-react";

import type { InventoryDocumentListData } from "../types";

import {
  formatInventoryDocumentDate,
  formatInventoryDocumentMoney,
  formatInventoryDocumentStatus,
  formatInventoryDocumentType,
  getInventoryDocumentStatusClassName,
} from "../utils/inventoryDocumentUi";

type InventoryDocumentsTableProps = {
  data: InventoryDocumentListData;
  loading: boolean;
  selectedDocumentId: string | null;
  locale: string;
  currency: string;

  onSelect: (inventoryDocumentId: string) => void;

  onPageChange: (page: number) => void;

  onPageSizeChange: (pageSize: number) => void;
};

export default function InventoryDocumentsTable({
  data,
  loading,
  selectedDocumentId,
  locale,
  currency,
  onSelect,
  onPageChange,
  onPageSizeChange,
}: InventoryDocumentsTableProps) {
  const { items, pagination } = data;

  const firstVisible =
    items.length === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;

  const lastVisible = Math.min(
    pagination.page * pagination.page_size,
    pagination.total_items,
  );

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative min-h-[320px] min-w-0 overflow-auto lg:h-[calc(100vh-430px)] lg:max-h-[620px]">
        {loading ? (
          <div className="absolute right-4 top-3 z-30 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Actualizando
          </div>
        ) : null}

        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Operación
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Tipo y estado
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Fecha
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Ubicaciones
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Actividad
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Total
              </th>
            </tr>
          </thead>

          <tbody
            className={[
              "divide-y divide-slate-100 transition-opacity",
              loading ? "opacity-60" : "opacity-100",
            ].join(" ")}
          >
            {items.map((operation) => {
              const selected =
                selectedDocumentId === operation.inventory_document_id;

              return (
                <tr
                  key={operation.inventory_document_id}
                  role="button"
                  tabIndex={0}
                  aria-selected={selected}
                  onClick={() => onSelect(operation.inventory_document_id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();

                      onSelect(operation.inventory_document_id);
                    }
                  }}
                  className={[
                    "cursor-pointer outline-none transition focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-100",
                    selected ? "bg-blue-50/70" : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[280px] truncate text-sm font-semibold text-slate-950">
                          {operation.document_number}
                        </p>

                        <p className="mt-1 max-w-[280px] truncate text-xs text-slate-400">
                          {operation.reference_number ||
                            "Sin referencia externa"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-700">
                      {formatInventoryDocumentType(operation.document_type)}
                    </p>

                    <span
                      className={[
                        "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        getInventoryDocumentStatusClassName(operation.status),
                      ].join(" ")}
                    >
                      {formatInventoryDocumentStatus(operation.status)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-700">
                      {formatInventoryDocumentDate(
                        operation.document_date,
                        locale,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Fecha de la operación
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin
                        className="h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />

                      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                        <span className="max-w-[150px] truncate">
                          {operation.source_location?.name || "Sin origen"}
                        </span>

                        {operation.destination_location ? (
                          <>
                            <ArrowRight
                              className="h-3.5 w-3.5 shrink-0 text-slate-400"
                              aria-hidden="true"
                            />

                            <span className="max-w-[150px] truncate">
                              {operation.destination_location.name}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-700">
                      {operation.lines_count} producto
                      {operation.lines_count === 1 ? "" : "s"}
                    </p>

                    <p className="mt-1 text-xs tabular-nums text-slate-400">
                      {operation.movements_count} movimiento
                      {operation.movements_count === 1 ? "" : "s"}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-950">
                      {formatInventoryDocumentMoney(
                        operation.total_cost,
                        locale,
                        currency,
                      )}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-medium text-slate-500">
            Mostrando {firstVisible}–{lastVisible} de {pagination.total_items}{" "}
            operaciones
          </p>

          <select
            value={pagination.page_size}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            disabled={loading}
            aria-label="Operaciones por página"
            className="h-8 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value={25}>25 por página</option>

            <option value={50}>50 por página</option>

            <option value={100}>100 por página</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={loading || !pagination.has_previous_page}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </button>

          <span className="min-w-28 text-center text-xs font-semibold tabular-nums text-slate-500">
            Página {pagination.page} de {Math.max(pagination.total_pages, 1)}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={loading || !pagination.has_next_page}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
