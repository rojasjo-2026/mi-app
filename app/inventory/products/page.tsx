"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import InventoryModuleNav from "@/app/inventory/components/InventoryModuleNav";

import InventoryProductFilters from "./components/InventoryProductFilters";
import InventoryProductFormPanel from "./components/InventoryProductFormPanel";
import InventoryProductHeader from "./components/InventoryProductHeader";
import InventoryProductMetrics from "./components/InventoryProductMetrics";
import InventoryProductPreviewPanel from "./components/InventoryProductPreviewPanel";
import InventoryCodeFormPanel from "./variant-management/components/InventoryCodeFormPanel";
import InventoryVariantFormPanel from "./variant-management/components/InventoryVariantFormPanel";
import { useInventoryVariantManagementController } from "./variant-management/hooks/useInventoryVariantManagementController";
import InventoryProductStates from "./components/InventoryProductStates";
import InventoryProductTable from "./components/InventoryProductTable";
import { useInventoryProductCategories } from "./hooks/useInventoryProductCategories";
import { useInventoryProductFormController } from "./hooks/useInventoryProductFormController";
import { useInventoryProductStatusController } from "./hooks/useInventoryProductStatusController";
import { useInventoryProductDetail } from "./hooks/useInventoryProductDetail";
import { useInventoryProducts } from "./hooks/useInventoryProducts";
import { useInventoryProductUnits } from "./hooks/useInventoryProductUnits";
import { useInventoryProductVariants } from "./hooks/useInventoryProductVariants";
import type {
  InventoryProductDetail,
  InventoryProductFilters as InventoryProductFiltersState,
  InventoryProductMetricsData,
} from "./types";

const DEFAULT_FILTERS: InventoryProductFiltersState = {
  activeOnly: true,
  categoryId: "",
  productType: "ALL",
  trackingMode: "ALL",
  managesStock: "ALL",
  brand: "",
  pageSize: 25,
};

export default function InventoryProductsPage() {
  const { businessCountryMeta } = useAppSettings();

  const locale = businessCountryMeta.locale || "es";

  const currency = businessCountryMeta.currency || "";

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] =
    useState<InventoryProductFiltersState>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const [refreshKey, setRefreshKey] = useState(0);

  const handleProductSaved = useCallback((product: InventoryProductDetail) => {
    setPage(1);
    setSelectedProductId(product.inventory_product_id);
    setRefreshKey((current) => current + 1);
  }, []);

  const handleVariantManagementChanged = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const { items, loading, initialLoading, error } = useInventoryProducts({
    search: debouncedSearch,
    filters,
    refreshKey,
  });

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useInventoryProductCategories(refreshKey);

  const {
    units,
    loading: unitsLoading,
    error: unitsError,
  } = useInventoryProductUnits(refreshKey);
  const {
    detail,
    loading: detailLoading,
    error: detailError,
  } = useInventoryProductDetail(selectedProductId, refreshKey);

  const {
    variants,
    loading: variantsLoading,
    error: variantsError,
  } = useInventoryProductVariants(selectedProductId, refreshKey);

  const variantManagementController = useInventoryVariantManagementController({
    productId: selectedProductId,
    variants,
    onChanged: handleVariantManagementChanged,
  });

  const {
    open: formOpen,
    mode: formMode,
    form: productForm,
    formErrors,
    submitting: formSubmitting,
    serverError: formServerError,
    serverFieldErrors: formServerFieldErrors,
    openCreateForm,
    openEditForm,
    closeForm,
    changeField,
    submitForm,
  } = useInventoryProductFormController({
    onSaved: handleProductSaved,
  });
  const {
    submitting: statusSubmitting,
    error: statusError,
    changeProductStatus,
  } = useInventoryProductStatusController({
    onChanged: handleProductSaved,
  });

  async function handleToggleProductStatus() {
    if (!detail || statusSubmitting) {
      return;
    }

    const confirmed = window.confirm(
      detail.is_active
        ? `¿Desactivar "${detail.name}"? Dejará de aparecer en el filtro Solo activos.`
        : `¿Reactivar "${detail.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    await changeProductStatus(detail);
  }
  const totalPages = Math.max(1, Math.ceil(items.length / filters.pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const metrics = useMemo<InventoryProductMetricsData>(
    () => ({
      products: items.length,
      activeProducts: items.filter((product) => product.is_active).length,
      stockProducts: items.filter((product) => product.manages_stock).length,
      variants: items.reduce(
        (total, product) => total + product.variants_count,
        0,
      ),
      categories: categories.length,
    }),
    [categories.length, items],
  );

  function handleRefresh() {
    setRefreshKey((current) => current + 1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    setSelectedProductId(null);
  }

  function handleFilterChange<K extends keyof InventoryProductFiltersState>(
    field: K,
    value: InventoryProductFiltersState[K],
  ) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));

    setPage(1);
    setSelectedProductId(null);
  }

  function handleClearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSelectedProductId(null);
  }

  function handlePageChange(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));

    setSelectedProductId(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <InventoryModuleNav activeKey="products" />

        <InventoryProductHeader
          loading={loading || categoriesLoading}
          totalItems={items.length}
          onRefresh={handleRefresh}
          onCreate={openCreateForm}
        />

        <InventoryProductMetrics metrics={metrics} />

        <InventoryProductFilters
          search={search}
          filters={filters}
          categories={categories}
          categoriesLoading={categoriesLoading}
          resultCount={items.length}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        {categoriesError ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No se pudieron cargar las categorías: {categoriesError}
          </section>
        ) : null}

        {unitsError ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No se pudieron cargar las unidades: {unitsError}
          </section>
        ) : null}
        <InventoryProductStates
          initialLoading={initialLoading}
          error={error}
          itemCount={items.length}
          onRetry={handleRefresh}
        />

        {!initialLoading && !error && items.length > 0 ? (
          <InventoryProductTable
            items={items}
            selectedProductId={selectedProductId}
            page={page}
            pageSize={filters.pageSize}
            locale={locale}
            loading={loading}
            onSelect={setSelectedProductId}
            onPageChange={handlePageChange}
          />
        ) : null}
      </div>

      <InventoryProductFormPanel
        open={formOpen}
        mode={formMode}
        form={productForm}
        formErrors={formErrors}
        serverError={formServerError}
        serverFieldErrors={formServerFieldErrors}
        categories={categories}
        units={units}
        unitsLoading={unitsLoading}
        submitting={formSubmitting}
        onChange={changeField}
        onSubmit={submitForm}
        onClose={closeForm}
      />
      <InventoryProductPreviewPanel
        open={Boolean(selectedProductId)}
        detail={detail}
        detailLoading={detailLoading}
        detailError={detailError}
        variants={variants}
        variantsLoading={variantsLoading}
        variantsError={variantsError}
        variantManagementController={variantManagementController}
        locale={locale}
        currency={currency}
        onEdit={() => {
          if (detail) {
            openEditForm(detail, variants);
          }
        }}
        statusSubmitting={statusSubmitting}
        statusError={statusError}
        onToggleStatus={handleToggleProductStatus}
        onClose={() => {
          variantManagementController.clearMessages();
          setSelectedProductId(null);
        }}
      />

      <InventoryVariantFormPanel
        units={units}
        controller={variantManagementController}
      />

      <InventoryCodeFormPanel
        units={units}
        controller={variantManagementController}
      />
    </main>
  );
}
