"use client";

import { useCallback } from "react";

import type { InventoryProductDetail } from "../types";

import { useInventoryProductMutations } from "./useInventoryProductMutations";

type UseInventoryProductStatusControllerInput = {
  onChanged: (product: InventoryProductDetail) => void;
};

export function useInventoryProductStatusController({
  onChanged,
}: UseInventoryProductStatusControllerInput) {
  const {
    submitting,
    error,
    clearMutationError,
    deactivateProduct,
    activateProduct,
  } = useInventoryProductMutations();

  const changeProductStatus = useCallback(
    async (product: InventoryProductDetail) => {
      clearMutationError();

      const updatedProduct = product.is_active
        ? await deactivateProduct(product.inventory_product_id)
        : await activateProduct(product.inventory_product_id);

      if (!updatedProduct) {
        return false;
      }

      onChanged(updatedProduct);

      return true;
    },
    [activateProduct, clearMutationError, deactivateProduct, onChanged],
  );

  return {
    submitting,
    error,
    clearStatusError: clearMutationError,
    changeProductStatus,
  };
}
