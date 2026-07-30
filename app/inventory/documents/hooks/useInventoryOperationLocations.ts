"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse } from "../types";

export type InventoryOperationLocation = {
  inventory_location_id: string;
  parent_location_id: string | null;
  location_code: string;
  name: string;
  location_type: string;
  allows_stock: boolean;
  is_default: boolean;
  is_active: boolean;
};

export function useInventoryOperationLocations(enabled: boolean) {
  const [locations, setLocations] = useState<InventoryOperationLocation[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    async function loadLocations() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams({
          active_only: "true",
          allows_stock: "true",
        });

        const response = await fetch(
          `/api/inventory/locations?${searchParams.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: InventoryApiResponse<InventoryOperationLocation[]> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar las ubicaciones.",
          );
        }

        setLocations(result.data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar las ubicaciones.",
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
  }, [enabled]);

  return {
    locations,
    loading,
    error,
  };
}
