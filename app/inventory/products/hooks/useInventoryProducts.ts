"use client";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryProduct,
  InventoryProductFilters,
} from "../types";

type UseInventoryProductsInput = {
  search: string;
  filters: InventoryProductFilters;
  refreshKey: number;
};

export function useInventoryProducts({
  search,
  filters,
  refreshKey,
}: UseInventoryProductsInput) {
  const [items, setItems] = useState<InventoryProduct[]>([]);

  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams();

        searchParams.set("active_only", String(filters.activeOnly));

        if (search) {
          searchParams.set("search", search);
        }

        if (filters.categoryId) {
          searchParams.set("category_id", filters.categoryId);
        }

        if (filters.productType && filters.productType !== "ALL") {
          searchParams.set("product_type", filters.productType);
        }

        if (filters.trackingMode && filters.trackingMode !== "ALL") {
          searchParams.set("tracking_mode", filters.trackingMode);
        }

        if (filters.managesStock !== "ALL") {
          searchParams.set(
            "manages_stock",
            String(filters.managesStock === "YES"),
          );
        }

        if (filters.brand.trim()) {
          searchParams.set("brand", filters.brand.trim());
        }

        const response = await fetch(
          `/api/inventory/products?${searchParams.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryProduct[]> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar los productos.",
          );
        }

        setItems(result.data);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar los productos.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    filters.activeOnly,
    filters.brand,
    filters.categoryId,
    filters.managesStock,
    filters.productType,
    filters.trackingMode,
    refreshKey,
    search,
  ]);

  return {
    items,
    loading,
    initialLoading,
    error,
  };
}
