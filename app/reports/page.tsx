"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CLIENT_COLUMNS,
  DEFAULT_COLUMNS,
  EXCEL_EXPORT_LIMIT,
  initialFilters,
  PDF_EXPORT_LIMIT,
  PDF_MAX_COLUMNS,
} from "./config/reportBuilderConfig";
import type {
  ClientColumnKey,
  ClientReportResponse,
  ImportPreviewRow,
  PaginationState,
  ReportBuilderMetadata,
  ReportFilters,
  ReportMetadataResponse,
  ReportMode,
  ReportRow,
} from "./types";
import ReportsHeader from "./components/ReportsHeader";
import ReportsTabs from "./components/ReportsTabs";
import ReportSourcePanel from "./components/ReportSourcePanel";
import ReportFiltersPanel from "./components/ReportFiltersPanel";
import ReportColumnsPanel from "./components/ReportColumnsPanel";
import ReportPreviewTable from "./components/ReportPreviewTable";
import ReportImportPanel from "./components/ReportImportPanel";
import ReportTemplatesPanel from "./components/ReportTemplatesPanel";
import {
  downloadExcelReport,
  downloadPdfReport,
} from "./utils/reportExportUtils";

export default function ReportsPage() {
  const [mode, setMode] = useState<ReportMode>("builder");
  const [selectedColumns, setSelectedColumns] =
    useState<ClientColumnKey[]>(DEFAULT_COLUMNS);
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [metadata, setMetadata] = useState<ReportBuilderMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);

  const selectedColumnMeta = useMemo(
    () =>
      selectedColumns
        .map((columnKey) =>
          CLIENT_COLUMNS.find((column) => column.key === columnKey),
        )
        .filter((column): column is (typeof CLIENT_COLUMNS)[number] =>
          Boolean(column),
        ),
    [selectedColumns],
  );

  const pdfAvailable =
    rows.length > 0 && selectedColumns.length <= PDF_MAX_COLUMNS;

  function updateFilter(key: keyof ReportFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }

  function toggleColumn(columnKey: ClientColumnKey) {
    setSelectedColumns((current) => {
      if (current.includes(columnKey)) {
        if (current.length === 1) return current;

        return current.filter((key) => key !== columnKey);
      }

      return [...current, columnKey];
    });
  }

  function resetBuilder() {
    setFilters(initialFilters);
    setSelectedColumns(DEFAULT_COLUMNS);
    setPagination({
      page: 1,
      pageSize: 25,
      totalItems: 0,
      totalPages: 1,
    });
  }

  function buildQueryParams(options?: {
    page?: number;
    pageSize?: number;
    columns?: ClientColumnKey[];
  }) {
    const params = new URLSearchParams();

    params.set("page", String(options?.page ?? pagination.page));
    params.set("pageSize", String(options?.pageSize ?? pagination.pageSize));
    params.set("columns", (options?.columns ?? selectedColumns).join(","));

    if (filters.search.trim()) {
      params.set("search", filters.search.trim());
    }

    params.set("clientType", filters.clientType);
    params.set("status", filters.status);
    params.set("whatsapp", filters.whatsapp);
    params.set("autoContact", filters.autoContact);
    params.set("taxExempt", filters.taxExempt);
    params.set("installationStatus", filters.installationStatus);
    params.set("pendingBilling", filters.pendingBilling);
    params.set("countryCode", filters.countryCode);
    params.set("adminLevel1", filters.adminLevel1);
    params.set("adminLevel2", filters.adminLevel2);
    params.set("adminLevel3", filters.adminLevel3);
    params.set("operationalZoneId", filters.operationalZoneId);
    params.set("paymentTerm", filters.paymentTerm);
    params.set("preferredCurrency", filters.preferredCurrency);

    if (filters.createdFrom) params.set("createdFrom", filters.createdFrom);
    if (filters.createdTo) params.set("createdTo", filters.createdTo);
    if (filters.updatedFrom) params.set("updatedFrom", filters.updatedFrom);
    if (filters.updatedTo) params.set("updatedTo", filters.updatedTo);

    return params;
  }

  async function loadMetadata() {
    try {
      setMetadataLoading(true);

      const response = await fetch("/api/reports/builder/metadata", {
        cache: "no-store",
      });

      const result: ReportMetadataResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "No se pudo cargar la metadata");
      }

      setMetadata(result.data);
    } catch (err) {
      console.error(err);
      setMetadata(null);
    } finally {
      setMetadataLoading(false);
    }
  }

  async function fetchClientReportForExport(pageSize: number) {
    const params = buildQueryParams({
      page: 1,
      pageSize,
      columns: selectedColumns,
    });

    const response = await fetch(
      `/api/reports/builder/clients?${params.toString()}`,
      {
        cache: "no-store",
      },
    );

    const result: ClientReportResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "No se pudo exportar el reporte");
    }

    return {
      rows: result.data ?? [],
      pagination:
        result.pagination ??
        ({
          page: 1,
          pageSize,
          totalItems: result.data?.length ?? 0,
          totalPages: 1,
        } satisfies PaginationState),
    };
  }

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const params = buildQueryParams();

      const response = await fetch(
        `/api/reports/builder/clients?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const result: ClientReportResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el reporte");
      }

      setRows(result.data ?? []);
      setPagination(
        result.pagination ?? {
          page: 1,
          pageSize: 25,
          totalItems: 0,
          totalPages: 1,
        },
      );
    } catch (err) {
      console.error(err);
      setRows([]);
      setError("No se pudo cargar el reporte de clientes");
    } finally {
      setLoading(false);
    }
  }

  async function exportExcel() {
    try {
      setExportingExcel(true);
      setError("");

      const exportResult = await fetchClientReportForExport(EXCEL_EXPORT_LIMIT);

      await downloadExcelReport(
        `clarius-clientes-reporte-${new Date().toISOString().slice(0, 10)}.xlsx`,
        selectedColumns,
        exportResult.rows,
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo exportar el reporte a Excel");
    } finally {
      setExportingExcel(false);
    }
  }

  async function exportPdf() {
    if (!pdfAvailable) return;

    try {
      setExportingPdf(true);
      setError("");

      const exportResult = await fetchClientReportForExport(PDF_EXPORT_LIMIT);

      await downloadPdfReport(
        `clarius-clientes-reporte-${new Date().toISOString().slice(0, 10)}.pdf`,
        selectedColumns,
        exportResult.rows,
        exportResult.pagination.totalItems,
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo exportar el reporte a PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  useEffect(() => {
    void loadMetadata();
  }, []);

  useEffect(() => {
    void loadReport();
  }, [
    pagination.page,
    pagination.pageSize,
    selectedColumns,
    filters.search,
    filters.clientType,
    filters.status,
    filters.whatsapp,
    filters.autoContact,
    filters.taxExempt,
    filters.installationStatus,
    filters.pendingBilling,
    filters.countryCode,
    filters.adminLevel1,
    filters.adminLevel2,
    filters.adminLevel3,
    filters.operationalZoneId,
    filters.paymentTerm,
    filters.preferredCurrency,
    filters.createdFrom,
    filters.createdTo,
    filters.updatedFrom,
    filters.updatedTo,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
        <ReportsHeader
          rowsLength={rows.length}
          exportingExcel={exportingExcel}
          exportingPdf={exportingPdf}
          pdfAvailable={pdfAvailable}
          loading={loading}
          pdfMaxColumns={PDF_MAX_COLUMNS}
          selectedColumnsLength={selectedColumns.length}
          onExportExcel={exportExcel}
          onExportPdf={exportPdf}
          onRefresh={() => void loadReport()}
        />

        <ReportsTabs mode={mode} onModeChange={setMode} />

        {mode === "builder" && (
          <>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {selectedColumns.length > PDF_MAX_COLUMNS && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">
                  PDF no disponible para esta vista
                </p>
                <p className="mt-1">
                  El reporte tiene {selectedColumns.length} columnas. Para PDF,
                  seleccioná máximo {PDF_MAX_COLUMNS} columnas. Para análisis
                  completo, usá Exportar Excel.
                </p>
              </div>
            )}

            <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="flex flex-col gap-5">
                <ReportSourcePanel />

                <ReportFiltersPanel
                  filters={filters}
                  metadata={metadata}
                  metadataLoading={metadataLoading}
                  onFilterChange={updateFilter}
                  onReset={resetBuilder}
                />

                <ReportColumnsPanel
                  selectedColumns={selectedColumns}
                  onToggleColumn={toggleColumn}
                />
              </aside>

              <ReportPreviewTable
                rows={rows}
                loading={loading}
                pagination={pagination}
                selectedColumns={selectedColumns}
                selectedColumnMeta={selectedColumnMeta}
                exportingExcel={exportingExcel}
                exportingPdf={exportingPdf}
                pdfAvailable={pdfAvailable}
                onPageSizeChange={(pageSize) =>
                  setPagination((current) => ({
                    ...current,
                    page: 1,
                    pageSize,
                  }))
                }
                onPageChange={(page) =>
                  setPagination((current) => ({
                    ...current,
                    page,
                  }))
                }
                onExportExcel={exportExcel}
                onExportPdf={exportPdf}
              />
            </div>
          </>
        )}

        {mode === "import" && (
          <ReportImportPanel
            importPreview={importPreview}
            onPreviewChange={setImportPreview}
          />
        )}

        {mode === "templates" && <ReportTemplatesPanel />}
      </section>
    </main>
  );
}
