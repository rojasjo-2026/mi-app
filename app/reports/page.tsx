"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_COLUMNS_BY_SOURCE,
  EXCEL_EXPORT_LIMIT,
  initialFilters,
  PDF_EXPORT_LIMIT,
  PDF_MAX_COLUMNS,
  REPORT_COLUMNS_BY_SOURCE,
} from "./config/reportBuilderConfig";
import type {
  ActiveReportSource,
  ClientMetadataResponse,
  ClientReportBuilderMetadata,
  FollowUpReportBuilderMetadata,
  ImportPreviewRow,
  InstallationMetadataResponse,
  InstallationReportBuilderMetadata,
  PaginationState,
  ReportBuilderResponse,
  ReportColumnKey,
  ReportFilters,
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

const REPORT_ENDPOINTS: Record<ActiveReportSource, string> = {
  clients: "/api/reports/builder/clients",
  installations: "/api/reports/builder/installations",
  "follow-ups": "/api/reports/builder/follow-ups",
};

const METADATA_ENDPOINTS: Record<ActiveReportSource, string> = {
  clients: "/api/reports/builder/metadata",
  installations: "/api/reports/builder/installations/metadata",
  "follow-ups": "/api/reports/builder/follow-ups/metadata",
};

const initialPagination: PaginationState = {
  page: 1,
  pageSize: 25,
  totalItems: 0,
  totalPages: 1,
};

type FollowUpMetadataResponse = {
  success: boolean;
  data?: FollowUpReportBuilderMetadata | null;
  message?: string;
};

function getSourceTitle(source: ActiveReportSource) {
  if (source === "clients") return "Clientes";
  if (source === "installations") return "Instalaciones";

  return "Mantenimientos";
}

function getSourceFilename(source: ActiveReportSource) {
  if (source === "clients") return "clientes";
  if (source === "installations") return "instalaciones";

  return "mantenimientos";
}

function appendParam(params: URLSearchParams, key: string, value: string) {
  if (!value || value === "all") return;

  params.set(key, value);
}

function buildQueryParams({
  source,
  filters,
  columns,
  page,
  pageSize,
}: {
  source: ActiveReportSource;
  filters: ReportFilters;
  columns: ReportColumnKey[];
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("columns", columns.join(","));

  appendParam(params, "search", filters.search);

  appendParam(params, "pendingBilling", filters.pendingBilling);
  appendParam(params, "countryCode", filters.countryCode);
  appendParam(params, "adminLevel1", filters.adminLevel1);
  appendParam(params, "adminLevel2", filters.adminLevel2);
  appendParam(params, "adminLevel3", filters.adminLevel3);
  appendParam(params, "operationalZoneId", filters.operationalZoneId);
  appendParam(params, "createdFrom", filters.createdFrom);
  appendParam(params, "createdTo", filters.createdTo);
  appendParam(params, "updatedFrom", filters.updatedFrom);
  appendParam(params, "updatedTo", filters.updatedTo);

  if (source === "clients") {
    appendParam(params, "clientType", filters.clientType);
    appendParam(params, "status", filters.status);
    appendParam(params, "whatsapp", filters.whatsapp);
    appendParam(params, "autoContact", filters.autoContact);
    appendParam(params, "taxExempt", filters.taxExempt);
    appendParam(params, "paymentTerm", filters.paymentTerm);
    appendParam(params, "preferredCurrency", filters.preferredCurrency);
  }

  if (source === "installations") {
    appendParam(params, "clientId", filters.clientId);
    appendParam(params, "serviceTypeId", filters.serviceTypeId);
    appendParam(params, "technicianId", filters.technicianId);
    appendParam(params, "installationStatus", filters.installationStatus);
    appendParam(params, "billingStatus", filters.billingStatus);
    appendParam(params, "isActive", filters.isActive);
    appendParam(params, "pendingMaintenance", filters.pendingMaintenance);
    appendParam(params, "city", filters.city);
    appendParam(params, "zone", filters.zone);
    appendParam(params, "minEstimatedAmount", filters.minEstimatedAmount);
    appendParam(params, "maxEstimatedAmount", filters.maxEstimatedAmount);
    appendParam(params, "installationFrom", filters.installationFrom);
    appendParam(params, "installationTo", filters.installationTo);
    appendParam(params, "warrantyFrom", filters.warrantyFrom);
    appendParam(params, "warrantyTo", filters.warrantyTo);
  }

  if (source === "follow-ups") {
    appendParam(params, "clientId", filters.clientId);
    appendParam(params, "installationId", filters.installationId);
    appendParam(params, "followUpStatusId", filters.followUpStatusId);
    appendParam(params, "technicianId", filters.technicianId);
    appendParam(params, "billingStatus", filters.billingStatus);
    appendParam(params, "completionStatus", filters.completionStatus);
    appendParam(params, "contactFlow", filters.contactFlow);
    appendParam(params, "contactAttempts", filters.contactAttempts);
    appendParam(params, "priority", filters.priority);
    appendParam(params, "maintenanceType", filters.maintenanceType);
    appendParam(params, "createdFromSource", filters.createdFromSource);
    appendParam(params, "minEstimatedAmount", filters.minEstimatedAmount);
    appendParam(params, "maxEstimatedAmount", filters.maxEstimatedAmount);
    appendParam(params, "targetFrom", filters.targetFrom);
    appendParam(params, "targetTo", filters.targetTo);
    appendParam(params, "dueFrom", filters.dueFrom);
    appendParam(params, "dueTo", filters.dueTo);
    appendParam(params, "scheduledFrom", filters.scheduledFrom);
    appendParam(params, "scheduledTo", filters.scheduledTo);
    appendParam(params, "completedFrom", filters.completedFrom);
    appendParam(params, "completedTo", filters.completedTo);
  }

  return params;
}

export default function ReportsPage() {
  const [mode, setMode] = useState<ReportMode>("builder");
  const [source, setSource] = useState<ActiveReportSource>("clients");

  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [selectedColumns, setSelectedColumns] = useState<ReportColumnKey[]>([
    ...DEFAULT_COLUMNS_BY_SOURCE.clients,
  ]);

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [pagination, setPagination] =
    useState<PaginationState>(initialPagination);

  const [clientMetadata, setClientMetadata] =
    useState<ClientReportBuilderMetadata | null>(null);
  const [installationMetadata, setInstallationMetadata] =
    useState<InstallationReportBuilderMetadata | null>(null);
  const [followUpMetadata, setFollowUpMetadata] =
    useState<FollowUpReportBuilderMetadata | null>(null);

  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");

  const availableColumns = useMemo(
    () => REPORT_COLUMNS_BY_SOURCE[source],
    [source],
  );

  const selectedColumnMeta = useMemo(
    () =>
      availableColumns.filter((column) => selectedColumns.includes(column.key)),
    [availableColumns, selectedColumns],
  );

  const canExportPdf =
    selectedColumns.length > 0 && selectedColumns.length <= PDF_MAX_COLUMNS;

  const loadMetadata = useCallback(async () => {
    try {
      setMetadataLoading(true);

      const [clientResponse, installationResponse, followUpResponse] =
        await Promise.all([
          fetch(METADATA_ENDPOINTS.clients),
          fetch(METADATA_ENDPOINTS.installations),
          fetch(METADATA_ENDPOINTS["follow-ups"]),
        ]);

      const clientResult: ClientMetadataResponse = await clientResponse.json();
      const installationResult: InstallationMetadataResponse =
        await installationResponse.json();
      const followUpResult: FollowUpMetadataResponse =
        await followUpResponse.json();

      if (clientResponse.ok && clientResult.success && clientResult.data) {
        setClientMetadata(clientResult.data);
      }

      if (
        installationResponse.ok &&
        installationResult.success &&
        installationResult.data
      ) {
        setInstallationMetadata(installationResult.data);
      }

      if (
        followUpResponse.ok &&
        followUpResult.success &&
        followUpResult.data
      ) {
        setFollowUpMetadata(followUpResult.data);
      }
    } catch (metadataError) {
      console.error(metadataError);
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = buildQueryParams({
        source,
        filters,
        columns: selectedColumns,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      const response = await fetch(`${REPORT_ENDPOINTS[source]}?${params}`);
      const result: ReportBuilderResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el reporte");
      }

      setRows(result.data ?? []);
      setPagination((currentPagination) => ({
        ...currentPagination,
        ...(result.pagination ?? {}),
      }));
    } catch (reportError) {
      console.error(reportError);
      setError("No se pudo cargar el reporte");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [source, filters, selectedColumns, pagination.page, pagination.pageSize]);

  async function fetchRowsForExport(limit: number) {
    const params = buildQueryParams({
      source,
      filters,
      columns: selectedColumns,
      page: 1,
      pageSize: limit,
    });

    const response = await fetch(`${REPORT_ENDPOINTS[source]}?${params}`);
    const result: ReportBuilderResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "No se pudo exportar el reporte");
    }

    return result.data ?? [];
  }

  async function handleExcelExport() {
    try {
      setExportingExcel(true);

      const exportRows = await fetchRowsForExport(EXCEL_EXPORT_LIMIT);

      await downloadExcelReport(
        `clarius-reporte-${getSourceFilename(source)}.xlsx`,
        source,
        selectedColumns,
        exportRows,
      );
    } catch (exportError) {
      console.error(exportError);
      setError("No se pudo exportar el Excel");
    } finally {
      setExportingExcel(false);
    }
  }

  async function handlePdfExport() {
    if (!canExportPdf) return;

    try {
      setExportingPdf(true);

      const exportRows = await fetchRowsForExport(PDF_EXPORT_LIMIT);

      await downloadPdfReport(
        `clarius-reporte-${getSourceFilename(source)}.pdf`,
        `Reporte de ${getSourceTitle(source)}`,
        source,
        selectedColumns,
        exportRows,
      );
    } catch (exportError) {
      console.error(exportError);
      setError("No se pudo exportar el PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  function handleSourceChange(nextSource: ActiveReportSource) {
    setSource(nextSource);
    setFilters(initialFilters);
    setSelectedColumns([...DEFAULT_COLUMNS_BY_SOURCE[nextSource]]);
    setRows([]);
    setPagination(initialPagination);
  }

  function handleFiltersChange(nextFilters: ReportFilters) {
    setFilters(nextFilters);
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1,
    }));
  }

  function handleSelectedColumnsChange(nextColumns: ReportColumnKey[]) {
    setSelectedColumns(nextColumns);
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1,
    }));
  }

  function handlePageChange(page: number) {
    setPagination((currentPagination) => ({
      ...currentPagination,
      page,
    }));
  }

  function handlePageSizeChange(pageSize: number) {
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1,
      pageSize,
    }));
  }

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    if (mode !== "builder") return;

    void loadReport();
  }, [mode, loadReport]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <ReportsHeader
          source={source}
          loading={loading || metadataLoading}
          exportingExcel={exportingExcel}
          exportingPdf={exportingPdf}
          totalItems={pagination.totalItems}
          selectedColumnCount={selectedColumns.length}
          canExportPdf={canExportPdf}
          onRefresh={() => void loadReport()}
          onExportExcel={() => void handleExcelExport()}
          onExportPdf={() => void handlePdfExport()}
        />

        <ReportsTabs
          mode={mode}
          onModeChange={setMode}
          importCount={importPreview.length}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {mode === "builder" && (
          <>
            <ReportSourcePanel
              source={source}
              onSourceChange={handleSourceChange}
              clientMetadata={clientMetadata}
              installationMetadata={installationMetadata}
              followUpMetadata={followUpMetadata}
            />

            <ReportFiltersPanel
              source={source}
              filters={filters}
              clientMetadata={clientMetadata}
              installationMetadata={installationMetadata}
              followUpMetadata={followUpMetadata}
              onFiltersChange={handleFiltersChange}
            />

            <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <ReportColumnsPanel
                source={source}
                columns={availableColumns}
                selectedColumns={selectedColumns}
                onSelectedColumnsChange={handleSelectedColumnsChange}
              />

              <ReportPreviewTable
                source={source}
                columns={selectedColumnMeta}
                rows={rows}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </section>
          </>
        )}

        {mode === "import" && (
          <ReportImportPanel
            importPreview={importPreview}
            onPreviewChange={setImportPreview}
          />
        )}

        {mode === "templates" && <ReportTemplatesPanel />}
      </div>
    </main>
  );
}
