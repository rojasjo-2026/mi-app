"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryCategory } from "../types";

export function useInventoryProductCategories(refreshKey: number) {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams({
          active_only: "true",
        });

        const response = await fetch(
          `/api/inventory/categories?${searchParams.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: InventoryApiResponse<InventoryCategory[]> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar las categorías.",
          );
        }

        setCategories(result.data);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setCategories([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar las categorías.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  return {
    categories,
    loading,
    error,
  };
}
