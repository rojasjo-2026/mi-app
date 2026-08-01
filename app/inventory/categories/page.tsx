"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

import InventoryModuleNav from "../components/InventoryModuleNav";
import InventoryCategoryFilters from "./components/InventoryCategoryFilters";
import InventoryCategoryFormPanel from "./components/InventoryCategoryFormPanel";
import InventoryCategoryHeader from "./components/InventoryCategoryHeader";
import InventoryCategoryMetrics from "./components/InventoryCategoryMetrics";
import InventoryCategoryPreviewPanel from "./components/InventoryCategoryPreviewPanel";
import {
  InventoryCategoryEmptyState,
  InventoryCategoryErrorState,
  InventoryCategoryLoadingState,
} from "./components/InventoryCategoryStates";
import InventoryCategoryTable from "./components/InventoryCategoryTable";
import { useInventoryCategories } from "./hooks/useInventoryCategories";
import { useInventoryCategoryDetail } from "./hooks/useInventoryCategoryDetail";
import { useInventoryCategoryFormController } from "./hooks/useInventoryCategoryFormController";
import { useInventoryCategoryStatusController } from "./hooks/useInventoryCategoryStatusController";
import type {
  InventoryCategoryDetail,
  InventoryCategoryFilters as InventoryCategoryFiltersState,
  InventoryCategoryMetricsData,
} from "./types";
import { buildInventoryCategoryTree } from "./utils/inventoryCategoryUi";

const DEFAULT_FILTERS: InventoryCategoryFiltersState = {
  activeOnly: true,
  hierarchyMode: "ALL",
  parentCategoryId: "",
  pageSize: 10,
};

export default function InventoryCategoriesPage() {
  const { businessCountryMeta } = useAppSettings();

  const locale = businessCountryMeta.locale || "es";

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] = useState<InventoryCategoryFiltersState>({
    ...DEFAULT_FILTERS,
  });

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  const { items, loading, initialLoading, error } = useInventoryCategories({
    search: debouncedSearch,
    filters,
    refreshKey,
  });

  const { items: parentOptions, error: parentOptionsError } =
    useInventoryCategories({
      search: "",
      filters: {
        activeOnly: false,
        hierarchyMode: "ALL",
        parentCategoryId: "",
        pageSize: 50,
      },
      refreshKey,
    });

  const {
    detail,
    loading: detailLoading,
    error: detailError,
  } = useInventoryCategoryDetail({
    categoryId: selectedCategoryId,
    refreshKey,
  });

  const handleCategorySaved = useCallback(
    (category: InventoryCategoryDetail) => {
      setRefreshKey((current) => current + 1);

      setSelectedCategoryId(category.inventory_category_id);
    },
    [],
  );

  const {
    open: formOpen,
    mode: formMode,
    editingCategoryId: formEditingCategoryId,
    form,
    formErrors,
    submitting: formSubmitting,
    error: formError,
    openCreateForm,
    openEditForm,
    closeForm,
    setField,
    submitForm,
  } = useInventoryCategoryFormController({
    onSaved: handleCategorySaved,
  });

  const handleCategoryStatusChanged = useCallback(
    (category: InventoryCategoryDetail) => {
      setRefreshKey((current) => current + 1);

      if (!category.is_active && filters.activeOnly) {
        setSelectedCategoryId(null);
        return;
      }

      setSelectedCategoryId(category.inventory_category_id);
    },
    [filters.activeOnly],
  );

  const {
    submitting: statusSubmitting,
    error: statusError,
    clearStatusError,
    changeCategoryStatus,
  } = useInventoryCategoryStatusController({
    onChanged: handleCategoryStatusChanged,
  });

  const treeItems = useMemo(() => buildInventoryCategoryTree(items), [items]);

  const metrics = useMemo<InventoryCategoryMetricsData>(
    () => ({
      categories: items.length,
      activeCategories: items.filter((category) => category.is_active).length,
      rootCategories: items.filter((category) => !category.parent_category_id)
        .length,
      subcategories: items.filter((category) =>
        Boolean(category.parent_category_id),
      ).length,
      assignedProducts: items.reduce(
        (total, category) => total + category.products_count,
        0,
      ),
    }),
    [items],
  );

  const totalPages = Math.ceil(treeItems.length / filters.pageSize);

  useEffect(() => {
    const validPage = Math.max(totalPages, 1);

    setPage((current) => Math.min(current, validPage));
  }, [totalPages]);

  const visibleItems = useMemo(() => {
    const start = (page - 1) * filters.pageSize;

    return treeItems.slice(start, start + filters.pageSize);
  }, [filters.pageSize, page, treeItems]);

  const hasFilters =
    Boolean(search) ||
    !filters.activeOnly ||
    filters.hierarchyMode !== "ALL" ||
    Boolean(filters.parentCategoryId) ||
    filters.pageSize !== 10;

  function handleFiltersChange(nextFilters: InventoryCategoryFiltersState) {
    setFilters(nextFilters);
    setPage(1);
    setSelectedCategoryId(null);
    clearStatusError();
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    setSelectedCategoryId(null);
    clearStatusError();
  }

  function clearFilters() {
    setSearch("");

    setFilters({
      ...DEFAULT_FILTERS,
    });

    setPage(1);
    setSelectedCategoryId(null);
    clearStatusError();
  }

  function refreshCategories() {
    clearStatusError();

    setRefreshKey((current) => current + 1);
  }

  function selectCategory(categoryId: string) {
    clearStatusError();
    setSelectedCategoryId(categoryId);
  }

  async function toggleCategoryStatus() {
    if (!detail || statusSubmitting) {
      return;
    }

    const confirmed = window.confirm(
      detail.is_active
        ? `¿Desactivar la categoría "${detail.name}"?`
        : `¿Reactivar la categoría "${detail.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    await changeCategoryStatus(detail);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <InventoryModuleNav activeKey="categories" />

        <InventoryCategoryHeader
          loading={loading}
          totalItems={items.length}
          onRefresh={refreshCategories}
          onCreate={() => openCreateForm()}
        />

        <InventoryCategoryMetrics metrics={metrics} />

        <InventoryCategoryFilters
          search={search}
          filters={filters}
          parentOptions={parentOptions}
          resultCount={treeItems.length}
          loading={loading}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
        />

        {parentOptionsError && !error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            No se pudieron cargar todas las opciones de categoría padre. El
            listado principal continúa disponible.
          </div>
        ) : null}

        {initialLoading ? (
          <InventoryCategoryLoadingState />
        ) : error ? (
          <InventoryCategoryErrorState
            message={error}
            onRetry={refreshCategories}
          />
        ) : treeItems.length === 0 ? (
          <InventoryCategoryEmptyState
            hasFilters={hasFilters}
            onCreate={() => openCreateForm()}
            onClearFilters={clearFilters}
          />
        ) : (
          <InventoryCategoryTable
            items={visibleItems}
            selectedCategoryId={selectedCategoryId}
            locale={locale}
            page={page}
            pageSize={filters.pageSize}
            totalItems={treeItems.length}
            totalPages={totalPages}
            loading={loading}
            onSelect={selectCategory}
            onPageChange={setPage}
          />
        )}
      </div>

      <InventoryCategoryPreviewPanel
        open={Boolean(selectedCategoryId)}
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
        onCreateChild={() => {
          if (detail) {
            openCreateForm(detail.inventory_category_id);
          }
        }}
        onToggleStatus={toggleCategoryStatus}
        onClose={() => {
          clearStatusError();
          setSelectedCategoryId(null);
        }}
      />

      <InventoryCategoryFormPanel
        open={formOpen}
        mode={formMode}
        editingCategoryId={formEditingCategoryId}
        form={form}
        errors={formErrors}
        submitting={formSubmitting}
        error={formError}
        parentOptions={parentOptions}
        onFieldChange={setField}
        onSubmit={() => {
          void submitForm();
        }}
        onClose={closeForm}
      />
    </main>
  );
}
