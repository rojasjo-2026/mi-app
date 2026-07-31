"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryMovement } from "../types";

export function useInventoryMovementDetail(
  movementId: string | null,
  refreshKey: number,
) {
  const [detail, setDetail] = useState<InventoryMovement | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!movementId) {
      setDetail(null);
      setError("");
      setLoading(false);

      return;
    }

    const resolvedMovementId = movementId;

    const controller = new AbortController();

    async function loadDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/inventory/movements/${encodeURIComponent(resolvedMovementId)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryMovement> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "No se pudo cargar el movimiento.");
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
            : "Ocurrió un error al cargar el movimiento.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      controller.abort();
    };
  }, [movementId, refreshKey]);

  return {
    detail,
    loading,
    error,
  };
}
