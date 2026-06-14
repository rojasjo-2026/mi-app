"use client";

import { PAGE_SIZE_OPTIONS } from "../config/reportBuilderConfig";
import type {
  PaginationState,
  ReportColumn,
  ReportRow,
  ReportSource,
} from "../types";
import { formatCellValue } from "../utils/reportFormatUtils";

type ReportPreviewTableProps = {
  source: ReportSource;
  columns: ReportColumn[];
  rows: ReportRow[];
  loading: boolean;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function getSourceEmptyLabel(source: ReportSource) {
  if (source === "clients") {
    return "No hay clientes para mostrar con los filtros actuales.";
  }

  return "No hay instalaciones para mostrar con los filtros actuales.";
}

export default function ReportPreviewTable({
  source,
  columns,
  rows,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
}: ReportPreviewTableProps) {
  const hasColumns = columns.length > 0;
  const hasRows = rows.length > 0;

  const currentPage = pagination.page;
  const totalPages = Math.max(1, pagination.totalPages);

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Vista previa
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Resultado del reporte
          </h2>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {pagination.totalItems.toLocaleString("es-CR")} registros
            encontrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Filas
            <select
              value={pagination.pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {PAGE_SIZE_OPTIONS.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={loading || currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <span className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={loading || currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {hasColumns ? (
                columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap border-b border-r border-slate-200 px-4 py-3 last:border-r-0"
                  >
                    {column.label}
                  </th>
                ))
              ) : (
                <th className="border-b border-slate-200 px-4 py-3">
                  Sin columnas
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-4 py-12 text-center text-sm font-medium text-slate-500"
                >
                  Cargando reporte...
                </td>
              </tr>
            )}

            {!loading && !hasColumns && (
              <tr>
                <td className="px-4 py-12 text-center text-sm font-medium text-amber-700">
                  Seleccioná al menos una columna para visualizar el reporte.
                </td>
              </tr>
            )}

            {!loading && hasColumns && !hasRows && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm font-medium text-slate-500"
                >
                  {getSourceEmptyLabel(source)}
                </td>
              </tr>
            )}

            {!loading &&
              hasColumns &&
              hasRows &&
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="max-w-[320px] whitespace-nowrap border-b border-r border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 last:border-r-0"
                      title={String(row[column.key] ?? "")}
                    >
                      <span className="block truncate">
                        {formatCellValue(column.key, row[column.key] ?? "") ||
                          "-"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
        <span>
          Página {currentPage} de {totalPages}
        </span>

        <span>
          Mostrando {rows.length.toLocaleString("es-CR")} de{" "}
          {pagination.totalItems.toLocaleString("es-CR")} registros
        </span>
      </div>
    </section>
  );
}
