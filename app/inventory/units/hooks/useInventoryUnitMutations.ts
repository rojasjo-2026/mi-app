"use client";

import { useState } from "react";

import type { InventoryApiResponse, InventoryUnitOfMeasure } from "../types";

export type InventoryUnitCreatePayload = {
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
};

export type InventoryUnitUpdatePayload = Partial<
  InventoryUnitCreatePayload & {
    is_active: boolean;
  }
>;

type InventoryUnitRequestOptions = {
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export function useInventoryUnitMutations() {
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearMutationError() {
    setError("");
    setFieldErrors({});
  }

  async function executeRequest(
    url: string,
    options: InventoryUnitRequestOptions,
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

      const result: InventoryApiResponse<InventoryUnitOfMeasure> =
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
          : "Ocurrió un error al procesar la unidad.";

      setError(message);

      return null;
    } finally {
      setSubmitting(false);
    }
  }

  function createUnit(payload: InventoryUnitCreatePayload) {
    return executeRequest("/api/inventory/units", {
      method: "POST",
      body: payload,
    });
  }

  function updateUnit(unitId: string, payload: InventoryUnitUpdatePayload) {
    return executeRequest(`/api/inventory/units/${unitId}`, {
      method: "PATCH",
      body: payload,
    });
  }

  function deactivateUnit(unitId: string) {
    return executeRequest(`/api/inventory/units/${unitId}`, {
      method: "DELETE",
    });
  }

  function activateUnit(unitId: string) {
    return updateUnit(unitId, {
      is_active: true,
    });
  }

  return {
    submitting,
    error,
    fieldErrors,
    clearMutationError,
    createUnit,
    updateUnit,
    deactivateUnit,
    activateUnit,
  };
}
