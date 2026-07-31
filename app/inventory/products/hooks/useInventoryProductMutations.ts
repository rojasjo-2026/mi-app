"use client";

import { useCallback, useState } from "react";

import type { InventoryApiResponse, InventoryProductDetail } from "../types";

type InventoryProductMutationMethod = "POST" | "PATCH" | "DELETE";

export function useInventoryProductMutations() {
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearMutationError = useCallback(() => {
    setError("");
    setFieldErrors({});
  }, []);

  const executeMutation = useCallback(
    async (
      url: string,
      method: InventoryProductMutationMethod,
      payload?: unknown,
    ): Promise<InventoryProductDetail | null> => {
      try {
        setSubmitting(true);
        setError("");
        setFieldErrors({});

        const response = await fetch(url, {
          method,
          headers:
            payload === undefined
              ? undefined
              : {
                  "Content-Type": "application/json",
                },
          body: payload === undefined ? undefined : JSON.stringify(payload),
        });

        let result: InventoryApiResponse<InventoryProductDetail>;

        try {
          result = await response.json();
        } catch {
          setError("El servidor devolvió una respuesta inválida.");

          return null;
        }

        if (!response.ok || !result.success || !result.data) {
          setError(result.message || "No se pudo completar la operación.");

          setFieldErrors(result.errors || {});

          return null;
        }

        return result.data;
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "Ocurrió un error al guardar el producto.",
        );

        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const createProduct = useCallback(
    (payload: unknown) =>
      executeMutation("/api/inventory/products", "POST", payload),
    [executeMutation],
  );

  const updateProduct = useCallback(
    (productId: string, payload: unknown) =>
      executeMutation(
        `/api/inventory/products/${encodeURIComponent(productId)}`,
        "PATCH",
        payload,
      ),
    [executeMutation],
  );

  const deactivateProduct = useCallback(
    (productId: string) =>
      executeMutation(
        `/api/inventory/products/${encodeURIComponent(productId)}`,
        "DELETE",
      ),
    [executeMutation],
  );

  const activateProduct = useCallback(
    (productId: string) =>
      executeMutation(
        `/api/inventory/products/${encodeURIComponent(productId)}`,
        "PATCH",
        {
          is_active: true,
        },
      ),
    [executeMutation],
  );

  return {
    submitting,
    error,
    fieldErrors,
    clearMutationError,
    createProduct,
    updateProduct,
    deactivateProduct,
    activateProduct,
  };
}
