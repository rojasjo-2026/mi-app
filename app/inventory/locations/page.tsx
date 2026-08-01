"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import InventoryModuleNav from "@/app/inventory/components/InventoryModuleNav";

import InventoryLocationFiltersPanel from "./components/InventoryLocationFilters";
import InventoryLocationFormPanel from "./components/InventoryLocationFormPanel";
import InventoryLocationHeader from "./components/InventoryLocationHeader";
import InventoryLocationMetrics from "./components/InventoryLocationMetrics";
import InventoryLocationPreviewPanel from "./components/InventoryLocationPreviewPanel";
import {
  InventoryLocationEmptyState,
  InventoryLocationErrorState,
  InventoryLocationLoadingState,
} from "./components/InventoryLocationStates";
import InventoryLocationTable from "./components/InventoryLocationTable";
import { useInventoryLocationDetail } from "./hooks/useInventoryLocationDetail";
import { useInventoryLocationFormController } from "./hooks/useInventoryLocationFormController";
import { useInventoryLocationMutations } from "./hooks/useInventoryLocationMutations";
import { useInventoryLocations } from "./hooks/useInventoryLocations";
import { useInventoryLocationStatusController } from "./hooks/useInventoryLocationStatusController";
import type { InventoryLocationFilters } from "./types";
import { buildInventoryLocationTree } from "./utils/inventoryLocationUi";
import {
  calculateInventoryLocationMetrics,
  createDefaultInventoryLocationFilters,
  hasInventoryLocationFilters,
  paginateInventoryLocations,
} from "./utils/inventoryLocationPage";

export default function InventoryLocationsPage() {
  const { businessCountryMeta } = useAppSettings();

  const locale = businessCountryMeta.locale || "es";

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] = useState<InventoryLocationFilters>(
    createDefaultInventoryLocationFilters,
  );

  const [page, setPage] = useState(1);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );

  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  const parentFilters = useMemo<InventoryLocationFilters>(
    () => ({
      activeOnly: false,
      hierarchyMode: "ALL",
      parentLocationId: "",
      locationType: "ALL",
      stockMode: "ALL",
      defaultMode: "ALL",
      pageSize: 50,
    }),
    [],
  );

  const { locations, loading, error, refresh } = useInventoryLocations({
    search: debouncedSearch,
    filters,
  });

  const { locations: parentOptions, refresh: refreshParentOptions } =
    useInventoryLocations({
      search: "",
      filters: parentFilters,
    });

  const {
    detail,
    loading: detailLoading,
    error: detailError,
  } = useInventoryLocationDetail({
    locationId: selectedLocationId,
    refreshKey: detailRefreshKey,
  });

  const mutations = useInventoryLocationMutations();

  const locationTree = useMemo(
    () => buildInventoryLocationTree(locations),
    [locations],
  );

  const metrics = useMemo(
    () => calculateInventoryLocationMetrics(locationTree),
    [locationTree],
  );

  const pagination = useMemo(
    () => paginateInventoryLocations(locationTree, page, filters.pageSize),
    [filters.pageSize, locationTree, page],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  useEffect(() => {
    if (page !== pagination.page) {
      setPage(pagination.page);
    }
  }, [page, pagination.page]);

  const refreshAll = useCallback(() => {
    refresh();
    refreshParentOptions();
  }, [refresh, refreshParentOptions]);

  const handleSaved = useCallback(
    async (savedLocation: { inventory_location_id: string }) => {
      setSelectedLocationId(savedLocation.inventory_location_id);

      setDetailRefreshKey((current) => current + 1);

      refreshAll();
    },
    [refreshAll],
  );

  const formController = useInventoryLocationFormController({
    createLocation: mutations.createLocation,
    updateLocation: mutations.updateLocation,
    onSaved: handleSaved,
  });

  const handleStatusChanged = useCallback(
    async (updatedLocation: {
      inventory_location_id: string;
      is_active: boolean;
    }) => {
      refreshAll();

      if (!updatedLocation.is_active && filters.activeOnly) {
        setSelectedLocationId(null);
        return;
      }

      setSelectedLocationId(updatedLocation.inventory_location_id);

      setDetailRefreshKey((current) => current + 1);
    },
    [filters.activeOnly, refreshAll],
  );

  const statusController = useInventoryLocationStatusController({
    location: detail,
    deactivateLocation: mutations.deactivateLocation,
    reactivateLocation: mutations.reactivateLocation,
    onChanged: handleStatusChanged,
  });

  useEffect(() => {
    statusController.clearActionError();
  }, [selectedLocationId, statusController.clearActionError]);

  const handleFiltersChange = useCallback(
    (nextFilters: InventoryLocationFilters) => {
      setFilters(nextFilters);
      setPage(1);
    },
    [],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setFilters(createDefaultInventoryLocationFilters());
    setPage(1);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedLocationId(null);
  }, []);

  const openCreate = useCallback(() => {
    formController.openCreate();
  }, [formController.openCreate]);

  const openEdit = useCallback(() => {
    if (detail) {
      formController.openEdit(detail);
    }
  }, [detail, formController.openEdit]);

  const openCreateChild = useCallback(() => {
    if (detail) {
      formController.openCreate(detail.inventory_location_id);
    }
  }, [detail, formController.openCreate]);

  const filtersApplied = hasInventoryLocationFilters(search, filters);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <InventoryModuleNav activeKey="locations" />

        <InventoryLocationHeader
          loading={loading}
          totalItems={locationTree.length}
          onRefresh={refreshAll}
          onCreate={openCreate}
        />

        <InventoryLocationMetrics metrics={metrics} locale={locale} />

        <InventoryLocationFiltersPanel
          search={search}
          filters={filters}
          parentOptions={parentOptions}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
          onReset={resetFilters}
        />

        {loading && locationTree.length === 0 ? (
          <InventoryLocationLoadingState />
        ) : null}

        {!loading && error ? (
          <InventoryLocationErrorState message={error} onRetry={refreshAll} />
        ) : null}

        {!loading && !error && locationTree.length === 0 ? (
          <InventoryLocationEmptyState
            hasFilters={filtersApplied}
            onCreate={openCreate}
            onReset={resetFilters}
          />
        ) : null}

        {!error && locationTree.length > 0 ? (
          <InventoryLocationTable
            items={pagination.items}
            selectedLocationId={selectedLocationId}
            page={pagination.page}
            pageSize={filters.pageSize}
            totalItems={locationTree.length}
            onSelect={setSelectedLocationId}
            onPageChange={setPage}
          />
        ) : null}
      </div>

      {selectedLocationId ? (
        <InventoryLocationPreviewPanel
          detail={detail}
          loading={detailLoading}
          error={detailError}
          changingStatus={mutations.changingStatus}
          actionError={statusController.actionError}
          locale={locale}
          onClose={closeDetail}
          onEdit={openEdit}
          onCreateChild={openCreateChild}
          onDeactivate={() => {
            void statusController.deactivate();
          }}
          onReactivate={() => {
            void statusController.reactivate();
          }}
          onSelectChild={setSelectedLocationId}
        />
      ) : null}

      {formController.isOpen && formController.mode ? (
        <InventoryLocationFormPanel
          mode={formController.mode}
          formState={formController.formState}
          errors={formController.errors}
          submitError={formController.submitError}
          saving={mutations.saving}
          parentOptions={parentOptions}
          editingLocationId={formController.editingLocationId}
          onClose={formController.closeForm}
          onSubmit={() => {
            void formController.submitForm();
          }}
          onFieldChange={formController.setField}
        />
      ) : null}
    </main>
  );
}
