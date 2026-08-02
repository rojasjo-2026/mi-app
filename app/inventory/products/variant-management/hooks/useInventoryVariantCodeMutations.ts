"use client";

import { useState } from "react";

import type { InventoryApiResponse, InventoryVariant } from "../../types";

import type {
  InventoryCode,
  InventoryCodeMutationInput,
  InventoryVariantDetail,
  InventoryVariantMutationInput,
} from "../types";

type MutationMethod = "POST" | "PATCH" | "DELETE";

type MutationAction =
  | "create-variant"
  | "update-variant"
  | "deactivate-variant"
  | "reactivate-variant"
  | "create-code"
  | "update-code"
  | "deactivate-code"
  | "reactivate-code";

type MutationResult<T> = {
  data: T;
  message: string;
};

async function executeMutation<T>(
  endpoint: string,
  method: MutationMethod,
  payload?: unknown,
): Promise<MutationResult<T>> {
  const response = await fetch(endpoint, {
    method,
    headers:
      payload === undefined
        ? undefined
        : {
            "Content-Type": "application/json",
          },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });

  let result: InventoryApiResponse<T>;

  try {
    result = (await response.json()) as InventoryApiResponse<T>;
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || "No se pudo completar la operación.");
  }

  return {
    data: result.data,
    message: result.message || "La operación se completó correctamente.",
  };
}

export function useInventoryVariantCodeMutations() {
  const [activeAction, setActiveAction] = useState<MutationAction | null>(null);

  const [error, setError] = useState("");

  function beginAction(action: MutationAction) {
    setActiveAction(action);
    setError("");
  }

  function finishAction() {
    setActiveAction(null);
  }

  function handleError(caughtError: unknown, fallbackMessage: string): never {
    const message =
      caughtError instanceof Error ? caughtError.message : fallbackMessage;

    setError(message);

    throw new Error(message);
  }

  async function createVariant(
    productId: string,
    payload: InventoryVariantMutationInput,
  ) {
    beginAction("create-variant");

    try {
      return await executeMutation<InventoryVariantDetail>(
        `/api/inventory/products/${encodeURIComponent(productId)}/variants`,
        "POST",
        payload,
      );
    } catch (caughtError) {
      return handleError(caughtError, "No se pudo crear la variante.");
    } finally {
      finishAction();
    }
  }

  async function updateVariant(
    variantId: string,
    payload: InventoryVariantMutationInput,
  ) {
    beginAction("update-variant");

    try {
      return await executeMutation<InventoryVariantDetail>(
        `/api/inventory/variants/${encodeURIComponent(variantId)}`,
        "PATCH",
        payload,
      );
    } catch (caughtError) {
      return handleError(caughtError, "No se pudo actualizar la variante.");
    } finally {
      finishAction();
    }
  }

  async function deactivateVariant(variantId: string) {
    beginAction("deactivate-variant");

    try {
      return await executeMutation<InventoryVariantDetail>(
        `/api/inventory/variants/${encodeURIComponent(variantId)}`,
        "DELETE",
      );
    } catch (caughtError) {
      return handleError(caughtError, "No se pudo desactivar la variante.");
    } finally {
      finishAction();
    }
  }

  async function reactivateVariant(variantId: string) {
    beginAction("reactivate-variant");

    try {
      return await executeMutation<InventoryVariantDetail>(
        `/api/inventory/variants/${encodeURIComponent(variantId)}`,
        "PATCH",
        {
          is_active: true,
        },
      );
    } catch (caughtError) {
      return handleError(caughtError, "No se pudo reactivar la variante.");
    } finally {
      finishAction();
    }
  }

  async function createCode(
    variantId: string,
    payload: InventoryCodeMutationInput,
  ) {
    beginAction("create-code");

    try {
      return await executeMutation<InventoryCode>(
        `/api/inventory/variants/${encodeURIComponent(variantId)}/codes`,
        "POST",
        payload,
      );
    } catch (caughtError) {
      return handleError(caughtError, "No se pudo crear el código.");
    } finally {
      finishAction();
    }
  }

  async function updateCode(
    codeId: string,
    payload: InventoryCodeMutationInput,
  ) {
    beginAction("update-code");

    try {
      return await executeMutation<InventoryCode>(
        `/api/inventory/codes/${encodeURIComponent(codeId)}`,
        "PATCH",
        payload,
      );
    } catch (caughtError) {
      return handleError(caughtError, "No se pudo actualizar el código.");
    } finally {
      finishAction();
    }
  }

  async function deactivateCode(codeId: string) {
    beginAction("deactivate-code");

    try {
      return await executeMutation<InventoryCode>(
        `/api/inventory/codes/${encodeURIComponent(codeId)}`,
        "DELETE",
      );
    } catch (caughtError) {
      return handleError(caughtError, "No se pudo desactivar el código.");
    } finally {
      finishAction();
    }
  }

  async function reactivateCode(codeId: string) {
    beginAction("reactivate-code");

    try {
      return await executeMutation<InventoryCode>(
        `/api/inventory/codes/${encodeURIComponent(codeId)}`,
        "PATCH",
        {
          is_active: true,
        },
      );
    } catch (caughtError) {
      return handleError(caughtError, "No se pudo reactivar el código.");
    } finally {
      finishAction();
    }
  }

  function clearError() {
    setError("");
  }

  function isActionLoading(action: MutationAction) {
    return activeAction === action;
  }

  return {
    activeAction,
    loading: activeAction !== null,
    error,
    clearError,
    isActionLoading,
    createVariant,
    updateVariant,
    deactivateVariant,
    reactivateVariant,
    createCode,
    updateCode,
    deactivateCode,
    reactivateCode,
  };
}

export type InventoryVariantCodeMutationHook = ReturnType<
  typeof useInventoryVariantCodeMutations
>;

export type InventoryVariantMutationResult = MutationResult<InventoryVariant>;

export type InventoryCodeMutationResult = MutationResult<InventoryCode>;
