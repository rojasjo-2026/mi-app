"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

import InventoryModuleNav from "../components/InventoryModuleNav";
import InventoryUnitFilters from "./components/InventoryUnitFilters";
import InventoryUnitFormPanel from "./components/InventoryUnitFormPanel";
import InventoryUnitHeader from "./components/InventoryUnitHeader";
import InventoryUnitMetrics from "./components/InventoryUnitMetrics";
import InventoryUnitPreviewPanel from "./components/InventoryUnitPreviewPanel";
import {
  InventoryUnitEmptyState,
  InventoryUnitErrorState,
  InventoryUnitLoadingState,
} from "./components/InventoryUnitStates";
import InventoryUnitTable from "./components/InventoryUnitTable";
import { useInventoryUnits } from "./hooks/useInventoryUnits";
import { useInventoryUnitDetail } from "./hooks/useInventoryUnitDetail";
import { useInventoryUnitFormController } from "./hooks/useInventoryUnitFormController";
import { useInventoryUnitStatusController } from "./hooks/useInventoryUnitStatusController";
import type {
  InventoryUnitFilters as InventoryUnitFiltersState,
  InventoryUnitMetricsData,
  InventoryUnitOfMeasure,
} from "./types";
import { sortInventoryUnits } from "./utils/inventoryUnitUi";

const DEFAULT_FILTERS: InventoryUnitFiltersState = {
  activeOnly: true,
  decimalMode: "ALL",
  pageSize: 10,
};

export default function InventoryUnitsPage() {
  const { businessCountryMeta } = useAppSettings();

  const locale = businessCountryMeta.locale || "es";

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] = useState<InventoryUnitFiltersState>({
    ...DEFAULT_FILTERS,
  });

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  const { items, loading, initialLoading, error } = useInventoryUnits({
    search: debouncedSearch,
    activeOnly: filters.activeOnly,
    refreshKey,
  });

  const {
    detail,
    loading: detailLoading,
    error: detailError,
  } = useInventoryUnitDetail({
    unitId: selectedUnitId,
    refreshKey,
  });

  const handleUnitSaved = useCallback((unit: InventoryUnitOfMeasure) => {
    setRefreshKey((current) => current + 1);

    setSelectedUnitId(unit.unit_of_measure_id);
  }, []);

  const {
    open: formOpen,
    mode: formMode,
    form,
    formErrors,
    submitting: formSubmitting,
    error: formError,
    openCreateForm,
    openEditForm,
    closeForm,
    setField,
    submitForm,
  } = useInventoryUnitFormController({
    onSaved: handleUnitSaved,
  });

  const handleUnitStatusChanged = useCallback(
    (unit: InventoryUnitOfMeasure) => {
      setRefreshKey((current) => current + 1);

      if (!unit.is_active && filters.activeOnly) {
        setSelectedUnitId(null);
        return;
      }

      setSelectedUnitId(unit.unit_of_measure_id);
    },
    [filters.activeOnly],
  );

  const {
    submitting: statusSubmitting,
    error: statusError,
    clearStatusError,
    changeUnitStatus,
  } = useInventoryUnitStatusController({
    onChanged: handleUnitStatusChanged,
  });

  const filteredItems = useMemo(() => {
    const matchingItems = items.filter((unit) => {
      if (filters.decimalMode === "DECIMAL") {
        return unit.allows_decimal;
      }

      if (filters.decimalMode === "INTEGER") {
        return !unit.allows_decimal;
      }

      return true;
    });

    return sortInventoryUnits(matchingItems);
  }, [filters.decimalMode, items]);

  const metrics = useMemo<InventoryUnitMetricsData>(
    () => ({
      units: filteredItems.length,
      activeUnits: filteredItems.filter((unit) => unit.is_active).length,
      decimalUnits: filteredItems.filter((unit) => unit.allows_decimal).length,
      integerUnits: filteredItems.filter((unit) => !unit.allows_decimal).length,
    }),
    [filteredItems],
  );

  const totalPages = Math.ceil(filteredItems.length / filters.pageSize);

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(totalPages, 1)));
  }, [totalPages]);

  const visibleItems = useMemo(() => {
    const start = (page - 1) * filters.pageSize;

    return filteredItems.slice(start, start + filters.pageSize);
  }, [filteredItems, filters.pageSize, page]);

  const hasFilters =
    Boolean(search) ||
    !filters.activeOnly ||
    filters.decimalMode !== "ALL" ||
    filters.pageSize !== 10;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    setSelectedUnitId(null);
    clearStatusError();
  }

  function handleFiltersChange(nextFilters: InventoryUnitFiltersState) {
    setFilters(nextFilters);
    setPage(1);
    setSelectedUnitId(null);
    clearStatusError();
  }

  function clearFilters() {
    setSearch("");

    setFilters({
      ...DEFAULT_FILTERS,
    });

    setPage(1);
    setSelectedUnitId(null);
    clearStatusError();
  }

  function refreshUnits() {
    clearStatusError();

    setRefreshKey((current) => current + 1);
  }

  function selectUnit(unitId: string) {
    clearStatusError();
    setSelectedUnitId(unitId);
  }

  async function toggleUnitStatus() {
    if (!detail || statusSubmitting) {
      return;
    }

    const confirmed = window.confirm(
      detail.is_active
        ? `¿Desactivar la unidad "${detail.name}"?`
        : `¿Reactivar la unidad "${detail.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    await changeUnitStatus(detail);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <InventoryModuleNav activeKey="units" />

        <InventoryUnitHeader
          loading={loading}
          totalItems={filteredItems.length}
          onRefresh={refreshUnits}
          onCreate={openCreateForm}
        />

        <InventoryUnitMetrics metrics={metrics} />

        <InventoryUnitFilters
          search={search}
          filters={filters}
          resultCount={filteredItems.length}
          loading={loading}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
        />

        {initialLoading ? (
          <InventoryUnitLoadingState />
        ) : error ? (
          <InventoryUnitErrorState message={error} onRetry={refreshUnits} />
        ) : filteredItems.length === 0 ? (
          <InventoryUnitEmptyState
            hasFilters={hasFilters}
            onCreate={openCreateForm}
            onClearFilters={clearFilters}
          />
        ) : (
          <InventoryUnitTable
            items={visibleItems}
            selectedUnitId={selectedUnitId}
            locale={locale}
            page={page}
            pageSize={filters.pageSize}
            totalItems={filteredItems.length}
            totalPages={totalPages}
            loading={loading}
            onSelect={selectUnit}
            onPageChange={setPage}
          />
        )}
      </div>

      <InventoryUnitPreviewPanel
        open={Boolean(selectedUnitId)}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        locale={locale}
        statusSubmitting={statusSubmitting}
        statusError={statusError}
        onEdit={() => {
          if (detail) {
            openEditForm(detail);
          }
        }}
        onToggleStatus={toggleUnitStatus}
        onClose={() => {
          clearStatusError();
          setSelectedUnitId(null);
        }}
      />

      <InventoryUnitFormPanel
        open={formOpen}
        mode={formMode}
        form={form}
        errors={formErrors}
        submitting={formSubmitting}
        error={formError}
        onFieldChange={setField}
        onSubmit={() => {
          void submitForm();
        }}
        onClose={closeForm}
      />
    </main>
  );
}
