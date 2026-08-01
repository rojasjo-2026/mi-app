"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryLocation,
  InventoryLocationFilters,
} from "../types";

type UseInventoryLocationsParams = {
  search: string;
  filters: InventoryLocationFilters;
};

export function useInventoryLocations({
  search,
  filters,
}: UseInventoryLocationsParams) {
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }

    params.set("active_only", String(filters.activeOnly));

    if (filters.locationType !== "ALL") {
      params.set("location_type", filters.locationType);
    }

    if (filters.hierarchyMode === "ROOT") {
      params.set("root_only", "true");
    } else if (filters.parentLocationId) {
      params.set("parent_location_id", filters.parentLocationId);
    }

    if (filters.stockMode === "ALLOWS_STOCK") {
      params.set("allows_stock", "true");
    }

    if (filters.stockMode === "NO_STOCK") {
      params.set("allows_stock", "false");
    }

    if (filters.defaultMode === "DEFAULT") {
      params.set("is_default", "true");
    }

    if (filters.defaultMode === "NOT_DEFAULT") {
      params.set("is_default", "false");
    }

    return params.toString();
  }, [
    filters.activeOnly,
    filters.defaultMode,
    filters.hierarchyMode,
    filters.locationType,
    filters.parentLocationId,
    filters.stockMode,
    search,
  ]);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/inventory/locations?${queryString}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const body = (await response.json()) as InventoryApiResponse<
          InventoryLocation[]
        >;

        if (!response.ok || !body.success) {
          throw new Error(
            body.message || "No fue posible cargar las ubicaciones.",
          );
        }

        setLocations(body.data || []);
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setLocations([]);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible cargar las ubicaciones.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadLocations();

    return () => {
      controller.abort();
    };
  }, [queryString, refreshKey]);

  return {
    locations,
    loading,
    error,
    refresh,
  };
}
