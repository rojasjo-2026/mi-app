"use client";

import { useEffect, useMemo, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

import InventoryModuleNav from "../components/InventoryModuleNav";

import InventoryMovementFilters from "./components/InventoryMovementFilters";
import InventoryMovementHeader from "./components/InventoryMovementHeader";
import InventoryMovementMetrics from "./components/InventoryMovementMetrics";
import InventoryMovementPreviewPanel from "./components/InventoryMovementPreviewPanel";
import InventoryMovementTable from "./components/InventoryMovementTable";

import {
  InventoryMovementEmptyState,
  InventoryMovementErrorState,
  InventoryMovementLoadingState,
} from "./components/InventoryMovementStates";

import { useInventoryMovementDetail } from "./hooks/useInventoryMovementDetail";
import { useInventoryMovements } from "./hooks/useInventoryMovements";

import type {
  InventoryMovementFilters as InventoryMovementFiltersState,
  InventoryMovementMetricsData,
} from "./types";

import { parseInventoryMovementDecimal } from "./utils/inventoryMovementUi";

const DEFAULT_FILTERS: InventoryMovementFiltersState = {
  movementType: "ALL",
  locationId: "",
  dateFrom: "",
  dateTo: "",
  pageSize: 25,
};

export default function InventoryMovementsPage() {
  const { businessCountryMeta, settingsError } = useAppSettings();

  const locale = businessCountryMeta.locale || "es";

  const currency = businessCountryMeta.currency || "";

  const [searchInput, setSearchInput] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] =
    useState<InventoryMovementFiltersState>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(
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

  const { data, loading, initialLoading, error } = useInventoryMovements({
    search: debouncedSearch,
    filters,
    page,
    refreshKey,
  });

  const {
    detail,
    loading: loadingDetail,
    error: detailError,
  } = useInventoryMovementDetail(selectedMovementId, refreshKey);

  const metrics = useMemo<InventoryMovementMetricsData>(() => {
    return data.items.reduce(
      (current, movement) => ({
        movements: data.pagination.total_items,

        quantityIn:
          current.quantityIn +
          parseInventoryMovementDecimal(movement.quantity_in),

        quantityOut:
          current.quantityOut +
          parseInventoryMovementDecimal(movement.quantity_out),

        valueIn:
          current.valueIn + parseInventoryMovementDecimal(movement.value_in),

        valueOut:
          current.valueOut + parseInventoryMovementDecimal(movement.value_out),
      }),
      {
        movements: data.pagination.total_items,

        quantityIn: 0,
        quantityOut: 0,
        valueIn: 0,
        valueOut: 0,
      },
    );
  }, [data.items, data.pagination.total_items]);

  const filtered =
    searchInput.trim().length > 0 ||
    filters.movementType !== DEFAULT_FILTERS.movementType ||
    filters.locationId !== DEFAULT_FILTERS.locationId ||
    filters.dateFrom !== DEFAULT_FILTERS.dateFrom ||
    filters.dateTo !== DEFAULT_FILTERS.dateTo ||
    filters.pageSize !== DEFAULT_FILTERS.pageSize;

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
    setSelectedMovementId(null);
  }

  function handleFiltersChange(nextFilters: InventoryMovementFiltersState) {
    setFilters(nextFilters);
    setPage(1);
    setSelectedMovementId(null);
  }

  function handleClearFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSelectedMovementId(null);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    setSelectedMovementId(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleRefresh() {
    setRefreshKey((current) => current + 1);
  }

  const totalItems = data.pagination.total_items;

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-col gap-4 pb-6">
        <InventoryModuleNav activeKey="movements" />

        <InventoryMovementHeader
          loading={loading}
          totalItems={totalItems}
          onRefresh={handleRefresh}
        />

        {settingsError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            No se pudo cargar la configuración regional. Se está usando la
            configuración base de CLARIUS.
          </div>
        ) : null}

        <InventoryMovementMetrics
          metrics={metrics}
          loading={initialLoading}
          locale={locale}
          currency={currency}
        />

        <InventoryMovementFilters
          search={searchInput}
          filters={filters}
          resultText={`${totalItems} movimiento${
            totalItems === 1 ? "" : "s"
          } disponible${totalItems === 1 ? "" : "s"}`}
          clearDisabled={!filtered}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />

        <div className="min-w-0">
          {initialLoading ? (
            <InventoryMovementLoadingState />
          ) : error && data.items.length === 0 ? (
            <InventoryMovementErrorState
              message={error}
              onRetry={handleRefresh}
            />
          ) : data.items.length === 0 ? (
            <InventoryMovementEmptyState
              filtered={filtered}
              onClear={handleClearFilters}
            />
          ) : (
            <InventoryMovementTable
              data={data}
              loading={loading}
              selectedMovementId={selectedMovementId}
              locale={locale}
              currency={currency}
              onSelect={setSelectedMovementId}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        <InventoryMovementPreviewPanel
          movementId={selectedMovementId}
          detail={detail}
          loading={loadingDetail}
          error={detailError}
          locale={locale}
          currency={currency}
          onClose={() => setSelectedMovementId(null)}
          onRefresh={handleRefresh}
        />
      </section>
    </main>
  );
}
