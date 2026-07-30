"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryDocumentDetail } from "../types";

export function useInventoryDocumentDetail(
  inventoryDocumentId: string | null,
  refreshKey: number,
) {
  const [detail, setDetail] = useState<InventoryDocumentDetail | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!inventoryDocumentId) {
      setDetail(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/inventory/documents/${inventoryDocumentId}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: InventoryApiResponse<InventoryDocumentDetail> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudo cargar la operación de inventario.",
          );
        }

        setDetail(result.data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setDetail(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar la operación de inventario.",
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
  }, [inventoryDocumentId, refreshKey]);

  return {
    detail,
    loading,
    error,
  };
}
