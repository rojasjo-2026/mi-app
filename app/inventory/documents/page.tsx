"use client";

import { useEffect, useMemo, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

import InventoryModuleNav from "../components/InventoryModuleNav";

import InventoryDocumentPreviewPanel from "./components/InventoryDocumentPreviewPanel";
import InventoryDocumentsFilters from "./components/InventoryDocumentsFilters";
import InventoryDocumentsHeader from "./components/InventoryDocumentsHeader";
import InventoryDocumentsMetrics from "./components/InventoryDocumentsMetrics";
import InventoryDocumentsTable from "./components/InventoryDocumentsTable";
import InventoryDocumentCancelDialog from "./components/InventoryDocumentCancelDialog";
import InventoryDocumentProcessDialog from "./components/InventoryDocumentProcessDialog";
import InventoryTransferReceiveDialog from "./components/InventoryTransferReceiveDialog";
import InventoryDraftLinesDialog from "./components/InventoryDraftLinesDialog";
import InventoryOperationCreateDialog from "./components/InventoryOperationCreateDialog";

import {
  InventoryDocumentsEmptyState,
  InventoryDocumentsErrorState,
  InventoryDocumentsLoadingState,
} from "./components/InventoryDocumentsStates";

import { useInventoryDocumentDetail } from "./hooks/useInventoryDocumentDetail";
import { useInventoryDocuments } from "./hooks/useInventoryDocuments";

import type {
  InventoryDocumentDetail,
  InventoryDocumentFilters as InventoryDocumentFiltersState,
  InventoryDocumentMetrics,
} from "./types";

import { parseInventoryDocumentDecimal } from "./utils/inventoryDocumentUi";

const DEFAULT_FILTERS: InventoryDocumentFiltersState = {
  documentType: "ALL",
  status: "ALL",
  dateFrom: "",
  dateTo: "",
  pageSize: 25,
};

export default function InventoryDocumentsPage() {
  const { businessCountryMeta, settingsError } = useAppSettings();

  const locale = businessCountryMeta.locale || "es";

  const currency = businessCountryMeta.currency || "";

  const [searchInput, setSearchInput] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] =
    useState<InventoryDocumentFiltersState>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [draftLinesDialogOpen, setDraftLinesDialogOpen] = useState(false);

  const [processDialogOpen, setProcessDialogOpen] = useState(false);

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  const { data, loading, error, initialLoading } = useInventoryDocuments({
    search: debouncedSearch,
    filters,
    page,
    refreshKey,
  });

  const {
    detail,
    loading: loadingDetail,
    error: detailError,
  } = useInventoryDocumentDetail(selectedDocumentId, refreshKey);

  const metrics = useMemo<InventoryDocumentMetrics>(
    () => ({
      total: data.pagination.total_items,

      drafts: data.items.filter((operation) => operation.status === "DRAFT")
        .length,

      inTransit: data.items.filter(
        (operation) =>
          operation.status === "IN_TRANSIT" ||
          operation.status === "PARTIALLY_RECEIVED",
      ).length,

      totalValue: data.items.reduce(
        (total, operation) =>
          total + parseInventoryDocumentDecimal(operation.total_cost),
        0,
      ),
    }),
    [data.items, data.pagination.total_items],
  );

  const filtered =
    searchInput.trim().length > 0 ||
    filters.documentType !== "ALL" ||
    filters.status !== "ALL" ||
    filters.dateFrom.length > 0 ||
    filters.dateTo.length > 0 ||
    filters.pageSize !== DEFAULT_FILTERS.pageSize;

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function handleFiltersChange(nextFilters: InventoryDocumentFiltersState) {
    setFilters(nextFilters);
    setPage(1);
  }

  function handleClearFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    setSelectedDocumentId(null);
    setPage(nextPage);
  }

  function handlePageSizeChange(pageSize: number) {
    setSelectedDocumentId(null);

    setFilters((current) => ({
      ...current,
      pageSize,
    }));

    setPage(1);
  }

  function handleRefresh() {
    setRefreshKey((current) => current + 1);
  }

  function handleOperationCreated(operation: InventoryDocumentDetail) {
    setSearchInput("");
    setDebouncedSearch("");

    setFilters((current) => ({
      ...DEFAULT_FILTERS,
      pageSize: current.pageSize,
      status: "DRAFT",
    }));

    setPage(1);

    setSelectedDocumentId(operation.inventory_document_id);

    setRefreshKey((current) => current + 1);
  }

  const totalItems = data.pagination.total_items;

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-col gap-4 pb-6">
        <InventoryModuleNav activeKey="documents" />

        <InventoryDocumentsHeader
          loading={loading}
          totalItems={totalItems}
          onCreate={() => setCreateDialogOpen(true)}
          onRefresh={handleRefresh}
        />

        {settingsError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            No se pudo cargar la configuración regional. Se está usando la
            configuración base de CLARIUS.
          </div>
        ) : null}

        <InventoryDocumentsMetrics
          metrics={metrics}
          loading={loading}
          locale={locale}
          currency={currency}
        />

        <InventoryDocumentsFilters
          search={searchInput}
          filters={filters}
          resultText={`${totalItems} operación${
            totalItems === 1 ? "" : "es"
          } disponible${totalItems === 1 ? "" : "s"}`}
          clearDisabled={!filtered}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />

        <div className="min-w-0">
          {initialLoading ? (
            <InventoryDocumentsLoadingState />
          ) : error && data.items.length === 0 ? (
            <InventoryDocumentsErrorState
              message={error}
              onRetry={handleRefresh}
            />
          ) : data.items.length === 0 ? (
            <InventoryDocumentsEmptyState
              filtered={filtered}
              onClear={handleClearFilters}
            />
          ) : (
            <InventoryDocumentsTable
              data={data}
              loading={loading}
              selectedDocumentId={selectedDocumentId}
              locale={locale}
              currency={currency}
              onSelect={setSelectedDocumentId}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>

        <InventoryDocumentCancelDialog
          open={cancelDialogOpen}
          detail={detail}
          locale={locale}
          currency={currency}
          onClose={() => setCancelDialogOpen(false)}
          onCancelled={(cancelledDocument) => {
            setCancelDialogOpen(false);

            setSelectedDocumentId(cancelledDocument.inventory_document_id);

            setFilters((current) => ({
              ...current,
              status: "ALL",
            }));

            setPage(1);
            handleRefresh();
          }}
        />

        <InventoryTransferReceiveDialog
          open={receiveDialogOpen}
          detail={detail}
          locale={locale}
          currency={currency}
          onClose={() => setReceiveDialogOpen(false)}
          onReceived={(receivedDocument) => {
            setReceiveDialogOpen(false);

            setSelectedDocumentId(receivedDocument.inventory_document_id);

            setFilters((current) => ({
              ...current,
              status: "ALL",
            }));

            setPage(1);
            handleRefresh();
          }}
        />

        <InventoryDocumentProcessDialog
          open={processDialogOpen}
          detail={detail}
          locale={locale}
          currency={currency}
          onClose={() => setProcessDialogOpen(false)}
          onProcessed={(processedDocument) => {
            setProcessDialogOpen(false);

            setSelectedDocumentId(processedDocument.inventory_document_id);

            setFilters((current) => ({
              ...current,
              status: "ALL",
            }));

            setPage(1);
            handleRefresh();
          }}
        />

        <InventoryDraftLinesDialog
          open={draftLinesDialogOpen}
          detail={detail}
          locale={locale}
          currency={currency}
          onClose={() => setDraftLinesDialogOpen(false)}
          onChanged={handleRefresh}
        />

        <InventoryOperationCreateDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCreated={handleOperationCreated}
        />

        <InventoryDocumentPreviewPanel
          documentId={
            draftLinesDialogOpen ||
            processDialogOpen ||
            receiveDialogOpen ||
            cancelDialogOpen
              ? null
              : selectedDocumentId
          }
          detail={detail}
          loading={loadingDetail}
          error={detailError}
          locale={locale}
          currency={currency}
          onClose={() => setSelectedDocumentId(null)}
          onRefresh={handleRefresh}
          onCancel={() => setCancelDialogOpen(true)}
          onManageProducts={() => setDraftLinesDialogOpen(true)}
          onProcess={() => setProcessDialogOpen(true)}
          onReceive={() => setReceiveDialogOpen(true)}
        />
      </section>
    </main>
  );
}
