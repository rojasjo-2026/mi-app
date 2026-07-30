"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryStockBalance } from "../types";

export function useInventoryStockBalanceDetail(
  inventoryStockBalanceId: string | null,
  refreshKey: number,
) {
  const [detail, setDetail] = useState<InventoryStockBalance | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!inventoryStockBalanceId) {
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
          `/api/inventory/stock-balances/${inventoryStockBalanceId}`,
          {
            cache: "no-store",

            signal: controller.signal,
          },
        );

        const result: InventoryApiResponse<InventoryStockBalance> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudo cargar el balance seleccionado.",
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
            : "Ocurrió un error al cargar el balance.",
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
  }, [inventoryStockBalanceId, refreshKey]);

  return {
    detail,
    loading,
    error,
  };
}
