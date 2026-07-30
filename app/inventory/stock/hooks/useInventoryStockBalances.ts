"use client";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryStockFilters,
  InventoryStockListData,
} from "../types";

const EMPTY_STOCK_DATA: InventoryStockListData = {
  items: [],

  pagination: {
    page: 1,
    page_size: 25,
    total_items: 0,
    total_pages: 0,
    has_previous_page: false,
    has_next_page: false,
  },
};

type UseInventoryStockBalancesParameters = {
  search: string;
  filters: InventoryStockFilters;
  page: number;
  refreshKey: number;
};

export function useInventoryStockBalances({
  search,
  filters,
  page,
  refreshKey,
}: UseInventoryStockBalancesParameters) {
  const [data, setData] = useState<InventoryStockListData>(EMPTY_STOCK_DATA);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStockBalances() {
      try {
        setLoading(true);

        setError("");

        const searchParams = new URLSearchParams({
          page: String(page),

          page_size: String(filters.pageSize),

          only_with_stock: String(filters.onlyWithStock),

          include_inactive: String(filters.includeInactive),
        });

        const cleanSearch = search.trim();

        if (cleanSearch) {
          searchParams.set("search", cleanSearch);
        }

        const response = await fetch(
          `/api/inventory/stock-balances?${searchParams.toString()}`,
          {
            cache: "no-store",

            signal: controller.signal,
          },
        );

        const result: InventoryApiResponse<InventoryStockListData> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar las existencias.",
          );
        }

        setData(result.data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar las existencias.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadStockBalances();

    return () => {
      controller.abort();
    };
  }, [
    filters.includeInactive,
    filters.onlyWithStock,
    filters.pageSize,
    page,
    refreshKey,
    search,
  ]);

  return {
    data,
    loading,
    error,

    initialLoading: loading && data.items.length === 0,
  };
}
