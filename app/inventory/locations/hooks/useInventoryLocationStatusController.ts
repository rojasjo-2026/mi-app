"use client";

import { useCallback, useState } from "react";

import type { InventoryLocation, InventoryLocationDetail } from "../types";

type InventoryLocationStatusMutation = (
  locationId: string,
) => Promise<InventoryLocationDetail>;

type UseInventoryLocationStatusControllerParams = {
  location: InventoryLocation | null;
  deactivateLocation: InventoryLocationStatusMutation;
  reactivateLocation: InventoryLocationStatusMutation;
  onChanged: (location: InventoryLocationDetail) => void | Promise<void>;
};

export function useInventoryLocationStatusController({
  location,
  deactivateLocation,
  reactivateLocation,
  onChanged,
}: UseInventoryLocationStatusControllerParams) {
  const [actionError, setActionError] = useState<string | null>(null);

  const deactivate = useCallback(async () => {
    if (!location || !location.is_active) {
      return null;
    }

    const confirmed = window.confirm(
      `¿Deseás desactivar la ubicación "${location.name}"?`,
    );

    if (!confirmed) {
      return null;
    }

    setActionError(null);

    try {
      const updatedLocation = await deactivateLocation(
        location.inventory_location_id,
      );

      await onChanged(updatedLocation);

      return updatedLocation;
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "No fue posible desactivar la ubicación.",
      );

      return null;
    }
  }, [deactivateLocation, location, onChanged]);

  const reactivate = useCallback(async () => {
    if (!location || location.is_active) {
      return null;
    }

    const confirmed = window.confirm(
      `¿Deseás reactivar la ubicación "${location.name}"?`,
    );

    if (!confirmed) {
      return null;
    }

    setActionError(null);

    try {
      const updatedLocation = await reactivateLocation(
        location.inventory_location_id,
      );

      await onChanged(updatedLocation);

      return updatedLocation;
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "No fue posible reactivar la ubicación.",
      );

      return null;
    }
  }, [location, onChanged, reactivateLocation]);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  return {
    actionError,
    deactivate,
    reactivate,
    clearActionError,
  };
}
