"use client";

import type { InventoryCategoryDetail } from "../types";
import { useInventoryCategoryMutations } from "./useInventoryCategoryMutations";

type UseInventoryCategoryStatusControllerInput = {
  onChanged: (category: InventoryCategoryDetail) => void;
};

export function useInventoryCategoryStatusController({
  onChanged,
}: UseInventoryCategoryStatusControllerInput) {
  const {
    submitting,
    error,
    clearMutationError,
    deactivateCategory,
    activateCategory,
  } = useInventoryCategoryMutations();

  async function changeCategoryStatus(category: InventoryCategoryDetail) {
    clearMutationError();

    const changedCategory = category.is_active
      ? await deactivateCategory(category.inventory_category_id)
      : await activateCategory(category.inventory_category_id);

    if (!changedCategory) {
      return null;
    }

    onChanged(changedCategory);

    return changedCategory;
  }

  return {
    submitting,
    error,
    clearStatusError: clearMutationError,
    changeCategoryStatus,
  };
}
