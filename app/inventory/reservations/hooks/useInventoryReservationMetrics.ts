"use client";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryReservationListData,
  InventoryReservationMetrics,
} from "../types";

const EMPTY_METRICS: InventoryReservationMetrics = {
  operational: 0,
  drafts: 0,
  upcoming: 0,
  overdue: 0,
};

async function fetchReservationCount(query: string, signal: AbortSignal) {
  const response = await fetch(`/api/inventory/reservations?${query}`, {
    cache: "no-store",
    signal,
  });

  const result: InventoryApiResponse<InventoryReservationListData> =
    await response.json();

  if (!response.ok || !result.success || !result.data) {
    throw new Error(
      result.message || "No se pudo obtener el resumen de reservas.",
    );
  }

  return result.data.pagination.total_items;
}

export function useInventoryReservationMetrics(refreshKey: number) {
  const [metrics, setMetrics] =
    useState<InventoryReservationMetrics>(EMPTY_METRICS);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetrics() {
      try {
        setLoading(true);

        const [operational, drafts, upcoming, overdue] = await Promise.all([
          fetchReservationCount(
            "status=ACTIVE,PARTIALLY_CONSUMED&page_size=1",
            controller.signal,
          ),

          fetchReservationCount("status=DRAFT&page_size=1", controller.signal),

          fetchReservationCount(
            "status=ACTIVE,PARTIALLY_CONSUMED&expiration_status=UPCOMING&expiring_within_days=7&page_size=1",
            controller.signal,
          ),

          fetchReservationCount(
            "status=ACTIVE,PARTIALLY_CONSUMED&expiration_status=OVERDUE&page_size=1",
            controller.signal,
          ),
        ]);

        setMetrics({
          operational,
          drafts,
          upcoming,
          overdue,
        });
      } catch {
        if (!controller.signal.aborted) {
          setMetrics(EMPTY_METRICS);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMetrics();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  return {
    metrics,
    loading,
  };
}
