"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { PAGE_SIZE_OPTIONS } from "../config/reportBuilderConfig";
import type {
  ActiveReportSource,
  PaginationState,
  ReportColumn,
  ReportColumnKey,
  ReportRow,
} from "../types";
import { formatCellValue } from "../utils/reportFormatUtils";

type ReportPreviewTableProps = {
  source: ActiveReportSource;
  columns: ReportColumn[];
  availableColumns?: ReportColumn[];
  selectedColumns?: ReportColumnKey[];
  rows: ReportRow[];
  loading: boolean;
  pagination: PaginationState;
  onSelectedColumnsChange?: (columns: ReportColumnKey[]) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function getSourceEmptyLabel(source: ActiveReportSource) {
  if (source === "clients") {
    return "No hay clientes para mostrar con los filtros actuales.";
  }

  if (source === "installations") {
    return "No hay instalaciones para mostrar con los filtros actuales.";
  }

  return "No hay mantenimientos para mostrar con los filtros actuales.";
}

export default function ReportPreviewTable({
  source,
  columns,
  availableColumns,
  selectedColumns,
  rows,
  loading,
  pagination,
  onSelectedColumnsChange,
  onPageChange,
  onPageSizeChange,
}: ReportPreviewTableProps) {
  const { businessCountryMeta } = useAppSettings();
  const locale = businessCountryMeta.locale || "es";
  const currency = businessCountryMeta.currency;

  /*
   * Compatibilidad defensiva:
   * evita errores de ejecución si este componente todavía es invocado
   * desde una versión anterior de page.tsx.
   */
  const safeAvailableColumns = availableColumns ?? columns;
  const safeSelectedColumns =
    selectedColumns ?? columns.map((column) => column.key);
  const handleSelectedColumnsChange =
    onSelectedColumnsChange ?? (() => undefined);

  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const columnsPopoverRef = useRef<HTMLDivElement>(null);

  const hasColumns = columns.length > 0;
  const hasRows = rows.length > 0;

  const currentPage = pagination.page;
  const totalPages = Math.max(1, pagination.totalPages);

  const filteredAvailableColumns = useMemo(() => {
    const normalizedSearch = columnSearch.trim().toLocaleLowerCase(locale);

    if (!normalizedSearch) {
      return safeAvailableColumns;
    }

    return safeAvailableColumns.filter((column) => {
      const searchableText =
        `${column.label} ${column.description} ${column.group}`.toLocaleLowerCase(
          locale,
        );

      return searchableText.includes(normalizedSearch);
    });
  }, [safeAvailableColumns, columnSearch, locale]);

  useEffect(() => {
    if (!columnsOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        columnsPopoverRef.current &&
        !columnsPopoverRef.current.contains(event.target as Node)
      ) {
        setColumnsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setColumnsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [columnsOpen]);

  function toggleColumn(columnKey: ReportColumnKey) {
    if (safeSelectedColumns.includes(columnKey)) {
      handleSelectedColumnsChange(
        safeSelectedColumns.filter(
          (selectedColumn) => selectedColumn !== columnKey,
        ),
      );
      return;
    }

    handleSelectedColumnsChange([...safeSelectedColumns, columnKey]);
  }

  function selectAllColumns() {
    handleSelectedColumnsChange(
      safeAvailableColumns.map((column) => column.key),
    );
  }

  function clearColumns() {
    handleSelectedColumnsChange([]);
  }

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Vista previa
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Resultado del reporte
          </h2>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {pagination.totalItems.toLocaleString(locale)} registros encontrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div ref={columnsPopoverRef} className="relative">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={columnsOpen}
              onClick={() => setColumnsOpen((current) => !current)}
              className={[
                "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition",
                columnsOpen
                  ? "border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <span>Columnas</span>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {safeSelectedColumns.length}/{safeAvailableColumns.length}
              </span>

              <span
                aria-hidden="true"
                className={[
                  "text-[10px] transition-transform",
                  columnsOpen ? "rotate-180" : "",
                ].join(" ")}
              >
                ▼
              </span>
            </button>

            {columnsOpen && (
              <div
                role="dialog"
                aria-label="Seleccionar columnas del reporte"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Campos del reporte
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Seleccioná las columnas que querés mostrar y exportar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setColumnsOpen(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Cerrar selector de columnas"
                  >
                    ×
                  </button>
                </div>

                <input
                  type="search"
                  value={columnSearch}
                  onChange={(event) => setColumnSearch(event.target.value)}
                  placeholder="Buscar columna..."
                  className="mt-3 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllColumns}
                    disabled={safeAvailableColumns.length === 0}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Todas
                  </button>

                  <button
                    type="button"
                    onClick={clearColumns}
                    disabled={safeSelectedColumns.length === 0}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="mt-3 max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
                  {filteredAvailableColumns.map((column) => {
                    const checked = safeSelectedColumns.includes(column.key);

                    return (
                      <label
                        key={column.key}
                        className={[
                          "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition",
                          checked
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleColumn(column.key)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />

                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900">
                            {column.label}
                          </span>

                          <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                            {column.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}

                  {filteredAvailableColumns.length === 0 && (
                    <div className="rounded-md border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-500">
                      No se encontraron columnas.
                    </div>
                  )}
                </div>

                {safeSelectedColumns.length === 0 && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    Seleccioná al menos una columna para visualizar o exportar
                    el reporte.
                  </div>
                )}
              </div>
            )}
          </div>

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

      <div className="max-h-[520px] overflow-auto">
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
                        {formatCellValue(column.key, row[column.key] ?? "", {
                          locale,
                          currency,
                        }) || "-"}
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
          Mostrando {rows.length.toLocaleString(locale)} de{" "}
          {pagination.totalItems.toLocaleString(locale)} registros
        </span>
      </div>
    </section>
  );
}
