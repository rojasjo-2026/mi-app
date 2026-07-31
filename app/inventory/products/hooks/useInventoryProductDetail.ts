"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryProductDetail } from "../types";

export function useInventoryProductDetail(
  productId: string | null,
  refreshKey: number,
) {
  const [detail, setDetail] = useState<InventoryProductDetail | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) {
      setDetail(null);
      setLoading(false);
      setError("");

      return;
    }

    const resolvedProductId = productId;

    const controller = new AbortController();

    async function loadDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/inventory/products/${encodeURIComponent(resolvedProductId)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryProductDetail> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "No se pudo cargar el producto.");
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
            : "Ocurrió un error al cargar el producto.",
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
  }, [productId, refreshKey]);

  return {
    detail,
    loading,
    error,
  };
}
