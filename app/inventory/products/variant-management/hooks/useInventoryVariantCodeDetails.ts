"use client";

import { useCallback, useEffect, useState } from "react";

import type { InventoryApiResponse } from "../../types";

import type { InventoryCode, InventoryVariantDetail } from "../types";

type DetailState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};

const EMPTY_DETAIL_STATE = {
  data: null,
  loading: false,
  error: "",
};

async function fetchInventoryDetail<T>(
  endpoint: string,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  let result: InventoryApiResponse<T>;

  try {
    result = (await response.json()) as InventoryApiResponse<T>;
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || "No se pudo cargar la información.");
  }

  return result.data;
}

export function useInventoryVariantCodeDetails(
  variantId: string | null,
  codeId: string | null,
  refreshKey = 0,
) {
  const [variantState, setVariantState] =
    useState<DetailState<InventoryVariantDetail>>(EMPTY_DETAIL_STATE);

  const [codeState, setCodeState] =
    useState<DetailState<InventoryCode>>(EMPTY_DETAIL_STATE);

  const loadVariant = useCallback(
    async (currentVariantId: string, signal: AbortSignal) => {
      setVariantState({
        data: null,
        loading: true,
        error: "",
      });

      try {
        const data = await fetchInventoryDetail<InventoryVariantDetail>(
          `/api/inventory/variants/${encodeURIComponent(currentVariantId)}`,
          signal,
        );

        setVariantState({
          data,
          loading: false,
          error: "",
        });
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setVariantState({
          data: null,
          loading: false,
          error:
            caughtError instanceof Error
              ? caughtError.message
              : "No se pudo cargar la variante.",
        });
      }
    },
    [],
  );

  const loadCode = useCallback(
    async (currentCodeId: string, signal: AbortSignal) => {
      setCodeState({
        data: null,
        loading: true,
        error: "",
      });

      try {
        const data = await fetchInventoryDetail<InventoryCode>(
          `/api/inventory/codes/${encodeURIComponent(currentCodeId)}`,
          signal,
        );

        setCodeState({
          data,
          loading: false,
          error: "",
        });
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setCodeState({
          data: null,
          loading: false,
          error:
            caughtError instanceof Error
              ? caughtError.message
              : "No se pudo cargar el código.",
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (!variantId) {
      setVariantState({
        data: null,
        loading: false,
        error: "",
      });

      return;
    }

    const controller = new AbortController();

    void loadVariant(variantId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadVariant, refreshKey, variantId]);

  useEffect(() => {
    if (!codeId) {
      setCodeState({
        data: null,
        loading: false,
        error: "",
      });

      return;
    }

    const controller = new AbortController();

    void loadCode(codeId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [codeId, loadCode, refreshKey]);

  const reloadVariant = useCallback(() => {
    if (!variantId) {
      return;
    }

    const controller = new AbortController();

    void loadVariant(variantId, controller.signal);
  }, [loadVariant, variantId]);

  const reloadCode = useCallback(() => {
    if (!codeId) {
      return;
    }

    const controller = new AbortController();

    void loadCode(codeId, controller.signal);
  }, [codeId, loadCode]);

  function clearVariant() {
    setVariantState({
      data: null,
      loading: false,
      error: "",
    });
  }

  function clearCode() {
    setCodeState({
      data: null,
      loading: false,
      error: "",
    });
  }

  return {
    variantDetail: variantState.data,
    variantLoading: variantState.loading,
    variantError: variantState.error,

    codeDetail: codeState.data,
    codeLoading: codeState.loading,
    codeError: codeState.error,

    reloadVariant,
    reloadCode,
    clearVariant,
    clearCode,
  };
}
