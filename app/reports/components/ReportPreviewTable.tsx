"use client";

import { PAGE_SIZE_OPTIONS } from "../config/reportBuilderConfig";
import type {
  ClientColumnKey,
  PaginationState,
  ReportColumn,
  ReportRow,
} from "../types";
import { formatCellValue } from "../utils/reportFormatUtils";

type ReportPreviewTableProps = {
  rows: ReportRow[];
  loading: boolean;
  pagination: PaginationState;
  selectedColumns: ClientColumnKey[];
  selectedColumnMeta: ReportColumn[];
  exportingExcel: boolean;
  exportingPdf: boolean;
  pdfAvailable: boolean;
  onPageSizeChange: (pageSize: number) => void;
  onPageChange: (page: number) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
};

export default function ReportPreviewTable({
  rows,
  loading,
  pagination,
  selectedColumns,
  selectedColumnMeta,
  exportingExcel,
  exportingPdf,
  pdfAvailable,
  onPageSizeChange,
  onPageChange,
  onExportExcel,
  onExportPdf,
}: ReportPreviewTableProps) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Vista previa tipo Excel
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Reporte de clientes
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {pagination.totalItems} registros encontrados ·{" "}
            {selectedColumns.length} columnas seleccionadas
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={pagination.pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} por página
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={exportingExcel || rows.length === 0}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Excel
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportingPdf || !pdfAvailable}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {selectedColumnMeta.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap border-b border-r border-slate-200 px-4 py-3 last:border-r-0"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={selectedColumns.length}
                  className="px-4 py-10 text-center text-sm font-medium text-slate-500"
                >
                  Cargando reporte...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={selectedColumns.length}
                  className="px-4 py-10 text-center text-sm font-medium text-slate-500"
                >
                  No hay registros con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={`${rowIndex}-${row.client_name ?? "row"}`}
                  className="hover:bg-blue-50/40"
                >
                  {selectedColumns.map((columnKey) => (
                    <td
                      key={`${rowIndex}-${columnKey}`}
                      className="max-w-[260px] truncate border-b border-r border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 last:border-r-0"
                      title={String(row[columnKey] ?? "")}
                    >
                      {formatCellValue(columnKey, row[columnKey] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-500">
          Página {pagination.page} de {pagination.totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page <= 1 || loading}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          <button
            type="button"
            onClick={() =>
              onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
            }
            disabled={pagination.page >= pagination.totalPages || loading}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
