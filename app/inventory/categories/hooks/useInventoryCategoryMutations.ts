"use client";

import { useState } from "react";

import type { InventoryApiResponse, InventoryCategoryDetail } from "../types";

export type InventoryCategoryCreatePayload = {
  category_code: string | null;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  sort_order: number;
};

export type InventoryCategoryUpdatePayload = Partial<
  InventoryCategoryCreatePayload & {
    is_active: boolean;
  }
>;

type InventoryCategoryRequestOptions = {
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export function useInventoryCategoryMutations() {
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearMutationError() {
    setError("");
    setFieldErrors({});
  }

  async function executeRequest(
    url: string,
    options: InventoryCategoryRequestOptions,
  ) {
    try {
      setSubmitting(true);
      clearMutationError();

      const response = await fetch(url, {
        method: options.method,
        headers:
          options.body === undefined
            ? undefined
            : {
                "Content-Type": "application/json",
              },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      });

      const result: InventoryApiResponse<InventoryCategoryDetail> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        setFieldErrors(result.errors || {});

        throw new Error(result.message || "No se pudo completar la operación.");
      }

      return result.data;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Ocurrió un error al procesar la categoría.";

      setError(message);

      return null;
    } finally {
      setSubmitting(false);
    }
  }

  function createCategory(payload: InventoryCategoryCreatePayload) {
    return executeRequest("/api/inventory/categories", {
      method: "POST",
      body: payload,
    });
  }

  function updateCategory(
    categoryId: string,
    payload: InventoryCategoryUpdatePayload,
  ) {
    return executeRequest(`/api/inventory/categories/${categoryId}`, {
      method: "PATCH",
      body: payload,
    });
  }

  function deactivateCategory(categoryId: string) {
    return executeRequest(`/api/inventory/categories/${categoryId}`, {
      method: "DELETE",
    });
  }

  function activateCategory(categoryId: string) {
    return updateCategory(categoryId, {
      is_active: true,
    });
  }

  return {
    submitting,
    error,
    fieldErrors,
    clearMutationError,
    createCategory,
    updateCategory,
    deactivateCategory,
    activateCategory,
  };
}
