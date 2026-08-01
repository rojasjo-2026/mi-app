"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryUnitOfMeasure } from "../types";

type UseInventoryUnitsInput = {
  search: string;
  activeOnly: boolean;
  refreshKey: number;
};

export function useInventoryUnits({
  search,
  activeOnly,
  refreshKey,
}: UseInventoryUnitsInput) {
  const [items, setItems] = useState<InventoryUnitOfMeasure[]>([]);

  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadUnits() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams();

        searchParams.set("active_only", String(activeOnly));

        if (search) {
          searchParams.set("search", search);
        }

        const response = await fetch(
          `/api/inventory/units?${searchParams.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryUnitOfMeasure[]> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar las unidades.",
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
            : "Ocurrió un error al cargar las unidades.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    void loadUnits();

    return () => {
      controller.abort();
    };
  }, [activeOnly, refreshKey, search]);

  return {
    items,
    loading,
    initialLoading,
    error,
  };
}
