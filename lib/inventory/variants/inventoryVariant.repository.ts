import { prisma } from "@/lib/prisma";

import type {
  InventoryVariantCreateData,
  InventoryVariantFilters,
  InventoryVariantUpdateData,
} from "./inventoryVariant.types";

const inventoryVariantUnitSelect = {
  unit_of_measure_id: true,
  code: true,
  name: true,
  symbol: true,
  allows_decimal: true,
  decimal_scale: true,
  is_active: true,
} as const;

const inventoryVariantCodeSelect = {
  inventory_product_code_id: true,
  code: true,
  code_type: true,
  label: true,
  is_primary: true,
  is_scannable: true,
  is_active: true,
} as const;

export function findInventoryVariants(filters: InventoryVariantFilters) {
  return prisma.inventoryProductVariant.findMany({
    where: {
      ...(filters.activeOnly ? { is_active: true } : {}),
      ...(filters.productId ? { inventory_product_id: filters.productId } : {}),
      ...(filters.stockUnitId ? { stock_unit_id: filters.stockUnitId } : {}),
      ...(filters.isDefault !== undefined
        ? { is_default: filters.isDefault }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                name: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                codes: {
                  some: {
                    code: {
                      contains: filters.search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      stock_unit: {
        select: inventoryVariantUnitSelect,
      },
      _count: {
        select: {
          codes: true,
          stock_balances: true,
        },
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
        name: "asc",
      },
    ],
  });
}

export function findInventoryVariantById(inventoryProductVariantId: string) {
  return prisma.inventoryProductVariant.findUnique({
    where: {
      inventory_product_variant_id: inventoryProductVariantId,
    },
  });
}

export function findInventoryVariantDetailById(
  inventoryProductVariantId: string,
) {
  return prisma.inventoryProductVariant.findUnique({
    where: {
      inventory_product_variant_id: inventoryProductVariantId,
    },
    include: {
      stock_unit: {
        select: inventoryVariantUnitSelect,
      },
      codes: {
        select: inventoryVariantCodeSelect,
        orderBy: [
          {
            is_primary: "desc",
          },
          {
            code_type: "asc",
          },
          {
            code: "asc",
          },
        ],
      },
      _count: {
        select: {
          codes: true,
          stock_balances: true,
        },
      },
    },
  });
}

export function findInventoryVariantStockUnitById(unitOfMeasureId: string) {
  return prisma.unitOfMeasure.findUnique({
    where: {
      unit_of_measure_id: unitOfMeasureId,
    },
  });
}

export function createInventoryVariantRecord(
  inventoryProductId: string,
  data: InventoryVariantCreateData,
) {
  return prisma.$transaction(async (transaction) => {
    if (data.is_default) {
      await transaction.inventoryProductVariant.updateMany({
        where: {
          inventory_product_id: inventoryProductId,
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
    }

    return transaction.inventoryProductVariant.create({
      data: {
        inventory_product_id: inventoryProductId,
        stock_unit_id: data.stock_unit_id,
        name: data.name,
        attributes: data.attributes,
        default_cost: data.default_cost,
        default_price: data.default_price,
        minimum_stock: data.minimum_stock,
        maximum_stock: data.maximum_stock,
        is_default: data.is_default,
        sort_order: data.sort_order,
        is_active: true,
      },
    });
  });
}

export function updateInventoryVariantRecord(
  inventoryProductVariantId: string,
  inventoryProductId: string,
  data: InventoryVariantUpdateData,
) {
  return prisma.$transaction(async (transaction) => {
    if (data.is_default === true) {
      await transaction.inventoryProductVariant.updateMany({
        where: {
          inventory_product_id: inventoryProductId,
          inventory_product_variant_id: {
            not: inventoryProductVariantId,
          },
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
    }

    return transaction.inventoryProductVariant.update({
      where: {
        inventory_product_variant_id: inventoryProductVariantId,
      },
      data,
    });
  });
}

export function deactivateInventoryVariantRecord(
  inventoryProductVariantId: string,
  inventoryProductId: string,
  data: InventoryVariantUpdateData = {},
  replacementDefaultVariantId: string | null = null,
) {
  return prisma.$transaction(async (transaction) => {
    const deactivatedVariant = await transaction.inventoryProductVariant.update(
      {
        where: {
          inventory_product_variant_id: inventoryProductVariantId,
        },
        data: {
          ...data,
          is_active: false,
          is_default: false,
        },
      },
    );

    if (replacementDefaultVariantId) {
      await transaction.inventoryProductVariant.updateMany({
        where: {
          inventory_product_id: inventoryProductId,
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });

      await transaction.inventoryProductVariant.update({
        where: {
          inventory_product_variant_id: replacementDefaultVariantId,
        },
        data: {
          is_default: true,
        },
      });
    }

    return deactivatedVariant;
  });
}
export function countActiveInventoryProductVariants(
  inventoryProductId: string,
) {
  return prisma.inventoryProductVariant.count({
    where: {
      inventory_product_id: inventoryProductId,
      is_active: true,
    },
  });
}

export function findActiveDefaultInventoryVariant(inventoryProductId: string) {
  return prisma.inventoryProductVariant.findFirst({
    where: {
      inventory_product_id: inventoryProductId,
      is_active: true,
      is_default: true,
    },
  });
}
export function findAnotherActiveInventoryVariant(
  inventoryProductId: string,
  excludedVariantId: string,
) {
  return prisma.inventoryProductVariant.findFirst({
    where: {
      inventory_product_id: inventoryProductId,
      inventory_product_variant_id: {
        not: excludedVariantId,
      },
      is_active: true,
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
}

export function setInventoryVariantAsDefault(
  inventoryProductId: string,
  inventoryProductVariantId: string,
) {
  return prisma.$transaction(async (transaction) => {
    await transaction.inventoryProductVariant.updateMany({
      where: {
        inventory_product_id: inventoryProductId,
        is_default: true,
      },
      data: {
        is_default: false,
      },
    });

    return transaction.inventoryProductVariant.update({
      where: {
        inventory_product_variant_id: inventoryProductVariantId,
      },
      data: {
        is_default: true,
      },
    });
  });
}

export function getInventoryVariantStockTotals(
  inventoryProductVariantId: string,
) {
  return prisma.inventoryStockBalance.aggregate({
    where: {
      inventory_product_variant_id: inventoryProductVariantId,
    },
    _sum: {
      quantity_on_hand: true,
      quantity_reserved: true,
    },
  });
}
