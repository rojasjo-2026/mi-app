"use client";

import type { InventoryUnitOfMeasure } from "../types";
import { useInventoryUnitMutations } from "./useInventoryUnitMutations";

type UseInventoryUnitStatusControllerInput = {
  onChanged: (unit: InventoryUnitOfMeasure) => void;
};

export function useInventoryUnitStatusController({
  onChanged,
}: UseInventoryUnitStatusControllerInput) {
  const {
    submitting,
    error,
    clearMutationError,
    deactivateUnit,
    activateUnit,
  } = useInventoryUnitMutations();

  async function changeUnitStatus(unit: InventoryUnitOfMeasure) {
    clearMutationError();

    const changedUnit = unit.is_active
      ? await deactivateUnit(unit.unit_of_measure_id)
      : await activateUnit(unit.unit_of_measure_id);

    if (!changedUnit) {
      return null;
    }

    onChanged(changedUnit);

    return changedUnit;
  }

  return {
    submitting,
    error,
    clearStatusError: clearMutationError,
    changeUnitStatus,
  };
}
