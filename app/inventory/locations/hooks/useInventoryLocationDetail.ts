"use client";

import { useEffect, useState } from "react";

import type { InventoryApiResponse, InventoryLocationDetail } from "../types";

type UseInventoryLocationDetailParams = {
  locationId: string | null;
  refreshKey?: number;
};

export function useInventoryLocationDetail({
  locationId,
  refreshKey = 0,
}: UseInventoryLocationDetailParams) {
  const [detail, setDetail] = useState<InventoryLocationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      setDetail(null);
      setLoading(false);
      setError(null);
      return;
    }

    const currentLocationId = locationId;
    const controller = new AbortController();

    async function loadDetail() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/inventory/locations/${encodeURIComponent(currentLocationId)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const body =
          (await response.json()) as InventoryApiResponse<InventoryLocationDetail>;

        if (!response.ok || !body.success || !body.data) {
          throw new Error(
            body.message || "No fue posible cargar la ubicación.",
          );
        }

        setDetail(body.data);
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setDetail(null);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible cargar la ubicación.",
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
  }, [locationId, refreshKey]);

  return {
    detail,
    loading,
    error,
  };
}
