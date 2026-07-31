"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryVariant } from "../types";

export function useInventoryProductVariants(
  productId: string | null,
  refreshKey: number,
) {
  const [variants, setVariants] = useState<InventoryVariant[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) {
      setVariants([]);
      setLoading(false);
      setError("");

      return;
    }

    const resolvedProductId = productId;

    const controller = new AbortController();

    async function loadVariants() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams({
          active_only: "false",
        });

        const response = await fetch(
          `/api/inventory/products/${encodeURIComponent(
            resolvedProductId,
          )}/variants?${searchParams.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryVariant[]> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar las variantes.",
          );
        }

        setVariants(result.data);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setVariants([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar las variantes.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadVariants();

    return () => {
      controller.abort();
    };
  }, [productId, refreshKey]);

  return {
    variants,
    loading,
    error,
  };
}
