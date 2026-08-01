"use client";

import { useCallback, useState } from "react";

import type { InventoryApiResponse, InventoryLocationDetail } from "../types";

type InventoryLocationMutationInput = Record<string, unknown>;

async function readInventoryLocationResponse(
  response: Response,
): Promise<InventoryLocationDetail> {
  const body =
    (await response.json()) as InventoryApiResponse<InventoryLocationDetail>;

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.message || "No fue posible guardar la ubicación.");
  }

  return body.data;
}

export function useInventoryLocationMutations() {
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLocation = useCallback(
    async (
      input: InventoryLocationMutationInput,
    ): Promise<InventoryLocationDetail> => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/inventory/locations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        return await readInventoryLocationResponse(response);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible crear la ubicación.";

        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const updateLocation = useCallback(
    async (
      locationId: string,
      input: InventoryLocationMutationInput,
    ): Promise<InventoryLocationDetail> => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/inventory/locations/${encodeURIComponent(locationId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
          },
        );

        return await readInventoryLocationResponse(response);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible actualizar la ubicación.";

        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const deactivateLocation = useCallback(
    async (locationId: string): Promise<InventoryLocationDetail> => {
      setChangingStatus(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/inventory/locations/${encodeURIComponent(locationId)}`,
          {
            method: "DELETE",
          },
        );

        return await readInventoryLocationResponse(response);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible desactivar la ubicación.";

        setError(message);
        throw new Error(message);
      } finally {
        setChangingStatus(false);
      }
    },
    [],
  );

  const reactivateLocation = useCallback(
    async (locationId: string): Promise<InventoryLocationDetail> => {
      setChangingStatus(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/inventory/locations/${encodeURIComponent(locationId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              is_active: true,
            }),
          },
        );

        return await readInventoryLocationResponse(response);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible reactivar la ubicación.";

        setError(message);
        throw new Error(message);
      } finally {
        setChangingStatus(false);
      }
    },
    [],
  );

  return {
    saving,
    changingStatus,
    error,
    createLocation,
    updateLocation,
    deactivateLocation,
    reactivateLocation,
  };
}
