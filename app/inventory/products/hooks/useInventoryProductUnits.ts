"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryUnitOfMeasure } from "../types";

export function useInventoryProductUnits(refreshKey: number) {
  const [units, setUnits] = useState<InventoryUnitOfMeasure[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadUnits() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams({
          active_only: "true",
        });

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

        setUnits(result.data);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setUnits([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar las unidades.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUnits();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  return {
    units,
    loading,
    error,
  };
}
