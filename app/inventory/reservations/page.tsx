"use client";

import { useEffect, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

import InventoryModuleNav from "../components/InventoryModuleNav";

import InventoryReservationPreviewPanel from "./components/InventoryReservationPreviewPanel";
import InventoryReservationsFilters from "./components/InventoryReservationsFilters";
import InventoryReservationsHeader from "./components/InventoryReservationsHeader";
import InventoryReservationsMetrics from "./components/InventoryReservationsMetrics";
import InventoryReservationsTable from "./components/InventoryReservationsTable";

import {
  InventoryReservationsEmptyState,
  InventoryReservationsErrorState,
  InventoryReservationsLoadingState,
} from "./components/InventoryReservationsStates";

import { useInventoryReservationDetail } from "./hooks/useInventoryReservationDetail";

import { useInventoryReservationMetrics } from "./hooks/useInventoryReservationMetrics";

import { useInventoryReservations } from "./hooks/useInventoryReservations";

import type {
  InventoryReservationFilters,
  InventoryReservationStatus,
} from "./types";

const DEFAULT_FILTERS: InventoryReservationFilters = {
  status: "ALL",
  expiration: "ANY",
  sort: "updated_desc",
  pageSize: 25,
};

export default function InventoryReservationsPage() {
  const { businessCountryMeta, settingsError } = useAppSettings();

  const locale = businessCountryMeta.locale || "es";

  const [searchInput, setSearchInput] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] =
    useState<InventoryReservationFilters>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  const { data, loading, error, initialLoading } = useInventoryReservations({
    search: debouncedSearch,

    filters,
    page,
    refreshKey,
  });

  const { metrics, loading: loadingMetrics } =
    useInventoryReservationMetrics(refreshKey);

  const {
    detail,
    loading: loadingDetail,
    error: detailError,
  } = useInventoryReservationDetail(selectedReservationId, refreshKey);

  const filtered =
    searchInput.trim().length > 0 ||
    filters.status !== "ALL" ||
    filters.expiration !== "ANY" ||
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.pageSize !== DEFAULT_FILTERS.pageSize;

  function handleSearchChange(value: string) {
    setSearchInput(value);

    setPage(1);
  }

  function handleFiltersChange(nextFilters: InventoryReservationFilters) {
    setFilters(nextFilters);

    setPage(1);
  }

  function handleClearFilters() {
    setSearchInput("");

    setDebouncedSearch("");

    setFilters(DEFAULT_FILTERS);

    setPage(1);
  }

  function handleRefresh() {
    setRefreshKey((current) => current + 1);
  }

  function handleActionCompleted(nextStatus: InventoryReservationStatus) {
    setFilters((currentFilters) =>
      currentFilters.status === "ALL"
        ? currentFilters
        : {
            ...currentFilters,
            status: nextStatus,
          },
    );

    setPage(1);

    setRefreshKey((current) => current + 1);
  }
  const totalItems = data.pagination.total_items;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 lg:flex lg:h-[calc(100dvh-8.5rem)] lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 lg:min-h-0 lg:flex-1">
        <InventoryModuleNav activeKey="reservations" />

        <InventoryReservationsHeader
          loading={loading}
          totalItems={totalItems}
          onRefresh={handleRefresh}
        />

        {settingsError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            No se pudo cargar la configuracion regional. Se esta usando la
            configuracion base de CLARIUS.
          </div>
        ) : null}

        <InventoryReservationsMetrics
          metrics={metrics}
          loading={loadingMetrics}
        />

        <InventoryReservationsFilters
          search={searchInput}
          filters={filters}
          resultText={`${totalItems} resultado${
            totalItems === 1 ? "" : "s"
          } disponibles`}
          clearDisabled={!filtered}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />

        <div className="min-w-0 lg:min-h-0 lg:flex-1">
          {initialLoading ? (
            <InventoryReservationsLoadingState />
          ) : error && data.items.length === 0 ? (
            <InventoryReservationsErrorState
              message={error}
              onRetry={handleRefresh}
            />
          ) : data.items.length === 0 ? (
            <InventoryReservationsEmptyState
              filtered={filtered}
              onClear={handleClearFilters}
            />
          ) : (
            <InventoryReservationsTable
              data={data}
              loading={loading}
              selectedReservationId={selectedReservationId}
              locale={locale}
              onSelect={setSelectedReservationId}
              onPageChange={setPage}
            />
          )}
        </div>

        <InventoryReservationPreviewPanel
          reservationId={selectedReservationId}
          detail={detail}
          loading={loadingDetail}
          error={detailError}
          locale={locale}
          onClose={() => setSelectedReservationId(null)}
          onRefresh={handleRefresh}
          onActionCompleted={handleActionCompleted}
        />
      </section>
    </main>
  );
}
