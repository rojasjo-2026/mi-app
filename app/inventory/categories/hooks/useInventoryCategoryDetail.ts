"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryCategoryDetail } from "../types";

type UseInventoryCategoryDetailInput = {
  categoryId: string | null;
  refreshKey: number;
};

export function useInventoryCategoryDetail({
  categoryId,
  refreshKey,
}: UseInventoryCategoryDetailInput) {
  const [detail, setDetail] = useState<InventoryCategoryDetail | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!categoryId) {
      setDetail(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    async function loadCategoryDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/inventory/categories/${categoryId}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryCategoryDetail> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "No se pudo cargar la categoría.");
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
            : "Ocurrió un error al cargar la categoría.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCategoryDetail();

    return () => {
      controller.abort();
    };
  }, [categoryId, refreshKey]);

  return {
    detail,
    loading,
    error,
  };
}
