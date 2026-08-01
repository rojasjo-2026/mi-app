"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryUnitOfMeasure } from "../types";

type UseInventoryUnitDetailInput = {
  unitId: string | null;
  refreshKey: number;
};

export function useInventoryUnitDetail({
  unitId,
  refreshKey,
}: UseInventoryUnitDetailInput) {
  const [detail, setDetail] = useState<InventoryUnitOfMeasure | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!unitId) {
      setDetail(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    async function loadUnitDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/inventory/units/${unitId}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const result: InventoryApiResponse<InventoryUnitOfMeasure> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "No se pudo cargar la unidad.");
        }

        setDetail(result.data);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setDetail(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar la unidad.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUnitDetail();

    return () => {
      controller.abort();
    };
  }, [refreshKey, unitId]);

  return {
    detail,
    loading,
    error,
  };
}
