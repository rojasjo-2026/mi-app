"use client";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryReservationDetail,
} from "../types";

export function useInventoryReservationDetail(
  inventoryReservationId: string | null,
  refreshKey: number,
) {
  const [detail, setDetail] = useState<InventoryReservationDetail | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!inventoryReservationId) {
      setDetail(null);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/inventory/reservations/${inventoryReservationId}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: InventoryApiResponse<InventoryReservationDetail> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudo cargar el detalle de la reserva.",
          );
        }

        setDetail(result.data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setDetail(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrio un error al cargar el detalle.",
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
  }, [inventoryReservationId, refreshKey]);

  return {
    detail,
    loading,
    error,
  };
}
