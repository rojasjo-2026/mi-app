"use client";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryMovementFilters,
  InventoryMovementListData,
} from "../types";

const EMPTY_DATA: InventoryMovementListData = {
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

type UseInventoryMovementsInput = {
  search: string;
  filters: InventoryMovementFilters;
  page: number;
  refreshKey: number;
};

export function useInventoryMovements({
  search,
  filters,
  page,
  refreshKey,
}: UseInventoryMovementsInput) {
  const [data, setData] = useState<InventoryMovementListData>(EMPTY_DATA);

  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMovements() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams();

        searchParams.set("page", String(page));

        searchParams.set("page_size", String(filters.pageSize));

        if (search) {
          searchParams.set("search", search);
        }

        if (filters.movementType && filters.movementType !== "ALL") {
          searchParams.set("movement_type", filters.movementType);
        }

        if (filters.locationId) {
          searchParams.set("inventory_location_id", filters.locationId);
        }

        if (filters.dateFrom) {
          searchParams.set("date_from", filters.dateFrom);
        }

        if (filters.dateTo) {
          searchParams.set("date_to", filters.dateTo);
        }

        const response = await fetch(
          `/api/inventory/movements?${searchParams.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryMovementListData> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar los movimientos.",
          );
        }

        setData(result.data);
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
            : "Ocurrió un error al cargar los movimientos.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    void loadMovements();

    return () => {
      controller.abort();
    };
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.locationId,
    filters.movementType,
    filters.pageSize,
    page,
    refreshKey,
    search,
  ]);

  return {
    data,
    loading,
    initialLoading,
    error,
  };
}
