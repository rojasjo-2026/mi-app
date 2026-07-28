import { prisma } from "@/lib/prisma";

import type { InventoryProductUpdateData } from "./inventoryProduct.types";

export function reactivateInventoryProductWithFallbackVariant(
  inventoryProductId: string,
  data: InventoryProductUpdateData,
) {
  return prisma.$transaction(async (transaction) => {
    const candidateVariant =
      await transaction.inventoryProductVariant.findFirst({
        where: {
          inventory_product_id: inventoryProductId,
          stock_unit: {
            is_active: true,
          },
        },
        orderBy: [
          {
            is_default: "desc",
          },
          {
            sort_order: "asc",
          },
          {
            created_at: "asc",
          },
        ],
      });

    if (!candidateVariant) {
      return null;
    }

    await transaction.inventoryProductVariant.updateMany({
      where: {
        inventory_product_id: inventoryProductId,
        inventory_product_variant_id: {
          not: candidateVariant.inventory_product_variant_id,
        },
        is_default: true,
      },
      data: {
        is_default: false,
      },
    });

    await transaction.inventoryProductVariant.update({
      where: {
        inventory_product_variant_id:
          candidateVariant.inventory_product_variant_id,
      },
      data: {
        is_active: true,
        is_default: true,
      },
    });

    await transaction.inventoryProduct.update({
      where: {
        inventory_product_id: inventoryProductId,
      },
      data,
    });

    return candidateVariant;
  });
}
