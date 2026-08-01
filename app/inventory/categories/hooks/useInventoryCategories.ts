"use client";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryCategory,
  InventoryCategoryFilters,
} from "../types";

type UseInventoryCategoriesInput = {
  search: string;
  filters: InventoryCategoryFilters;
  refreshKey: number;
};

export function useInventoryCategories({
  search,
  filters,
  refreshKey,
}: UseInventoryCategoriesInput) {
  const [items, setItems] = useState<InventoryCategory[]>([]);

  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams();

        searchParams.set("active_only", String(filters.activeOnly));

        if (search) {
          searchParams.set("search", search);
        }

        if (filters.hierarchyMode === "ROOT") {
          searchParams.set("root_only", "true");
        } else if (filters.parentCategoryId) {
          searchParams.set("parent_category_id", filters.parentCategoryId);
        }

        const response = await fetch(
          `/api/inventory/categories?${searchParams.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryCategory[]> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar las categorías.",
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

        setItems([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar las categorías.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, [
    filters.activeOnly,
    filters.hierarchyMode,
    filters.parentCategoryId,
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
