"use client";

import { useEffect, useMemo, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

import InventoryModuleNav from "../components/InventoryModuleNav";

import InventoryStockFilters from "./components/InventoryStockFilters";
import InventoryStockHeader from "./components/InventoryStockHeader";
import InventoryStockMetrics from "./components/InventoryStockMetrics";
import InventoryStockPreviewPanel from "./components/InventoryStockPreviewPanel";
import InventoryStockTable from "./components/InventoryStockTable";

import {
  InventoryStockEmptyState,
  InventoryStockErrorState,
  InventoryStockLoadingState,
} from "./components/InventoryStockStates";

import { useInventoryStockBalanceDetail } from "./hooks/useInventoryStockBalanceDetail";

import { useInventoryStockBalances } from "./hooks/useInventoryStockBalances";

import type {
  InventoryStockFilters as InventoryStockFiltersState,
  InventoryStockMetricsData,
} from "./types";

import { parseInventoryDecimal } from "./utils/inventoryStockUi";

const DEFAULT_FILTERS: InventoryStockFiltersState = {
  onlyWithStock: false,
  includeInactive: false,
  pageSize: 25,
};

export default function InventoryStockPage() {
  const { businessCountryMeta, settingsError } = useAppSettings();

  const locale = businessCountryMeta.locale || "es";

  const currency = businessCountryMeta.currency || "";

  const [searchInput, setSearchInput] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] =
    useState<InventoryStockFiltersState>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedBalanceId, setSelectedBalanceId] = useState<string | null>(
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

  const { data, loading, error, initialLoading } = useInventoryStockBalances({
    search: debouncedSearch,

    filters,
    page,
    refreshKey,
  });

  const {
    detail,
    loading: loadingDetail,
    error: detailError,
  } = useInventoryStockBalanceDetail(selectedBalanceId, refreshKey);

  const metrics = useMemo<InventoryStockMetricsData>(() => {
    return data.items.reduce(
      (current, balance) => ({
        balances: data.pagination.total_items,

        quantityOnHand:
          current.quantityOnHand +
          parseInventoryDecimal(balance.quantity_on_hand),

        quantityReserved:
          current.quantityReserved +
          parseInventoryDecimal(balance.quantity_reserved),

        quantityAvailable:
          current.quantityAvailable +
          parseInventoryDecimal(balance.available_quantity),
      }),
      {
        balances: data.pagination.total_items,

        quantityOnHand: 0,

        quantityReserved: 0,

        quantityAvailable: 0,
      },
    );
  }, [data.items, data.pagination.total_items]);

  const filtered =
    searchInput.trim().length > 0 ||
    filters.onlyWithStock !== DEFAULT_FILTERS.onlyWithStock ||
    filters.includeInactive !== DEFAULT_FILTERS.includeInactive ||
    filters.pageSize !== DEFAULT_FILTERS.pageSize;

  function handleSearchChange(value: string) {
    setSearchInput(value);

    setPage(1);
  }

  function handleFiltersChange(nextFilters: InventoryStockFiltersState) {
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

  const totalItems = data.pagination.total_items;

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-col gap-4 pb-6">
        <InventoryModuleNav activeKey="stock" />

        <InventoryStockHeader
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

        <InventoryStockMetrics
          metrics={metrics}
          loading={initialLoading}
          locale={locale}
        />

        <InventoryStockFilters
          search={searchInput}
          filters={filters}
          resultText={`${totalItems} balance${
            totalItems === 1 ? "" : "s"
          } disponible${totalItems === 1 ? "" : "s"}`}
          clearDisabled={!filtered}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />

        <div className="min-w-0">
          {initialLoading ? (
            <InventoryStockLoadingState />
          ) : error && data.items.length === 0 ? (
            <InventoryStockErrorState message={error} onRetry={handleRefresh} />
          ) : data.items.length === 0 ? (
            <InventoryStockEmptyState
              filtered={filtered}
              onClear={handleClearFilters}
            />
          ) : (
            <InventoryStockTable
              data={data}
              loading={loading}
              selectedBalanceId={selectedBalanceId}
              locale={locale}
              currency={currency}
              onSelect={setSelectedBalanceId}
              onPageChange={setPage}
            />
          )}
        </div>

        <InventoryStockPreviewPanel
          balanceId={selectedBalanceId}
          detail={detail}
          loading={loadingDetail}
          error={detailError}
          locale={locale}
          currency={currency}
          onClose={() => setSelectedBalanceId(null)}
          onRefresh={handleRefresh}
        />
      </section>
    </main>
  );
}
