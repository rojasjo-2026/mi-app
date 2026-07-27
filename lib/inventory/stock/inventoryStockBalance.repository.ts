import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { InventoryStockBalanceFilters } from "./inventoryStockBalance.types";

const inventoryStockProductSelect = {
  inventory_product_id: true,
  name: true,
  brand: true,
  model: true,
  product_type: true,
  tracking_mode: true,
  manages_stock: true,
  allow_negative_stock: true,
  is_active: true,
} as const;

const inventoryStockUnitSelect = {
  unit_of_measure_id: true,
  code: true,
  name: true,
  symbol: true,
  allows_decimal: true,
  decimal_scale: true,
  is_active: true,
} as const;

const inventoryStockLocationSelect = {
  inventory_location_id: true,
  parent_location_id: true,
  location_code: true,
  name: true,
  location_type: true,
  allows_stock: true,
  is_default: true,
  is_active: true,
} as const;

const inventoryStockBalanceInclude = {
  variant: {
    include: {
      product: {
        select: inventoryStockProductSelect,
      },
      stock_unit: {
        select: inventoryStockUnitSelect,
      },
    },
  },
  location: {
    select: inventoryStockLocationSelect,
  },
} as const;

function buildInventoryStockBalanceWhere(
  filters: InventoryStockBalanceFilters,
): Prisma.InventoryStockBalanceWhereInput {
  const conditions: Prisma.InventoryStockBalanceWhereInput[] = [];

  if (filters.activeOnly) {
    conditions.push({
      variant: {
        is_active: true,
        product: {
          is_active: true,
        },
      },
      location: {
        is_active: true,
      },
    });
  }

  if (!filters.includeZero) {
    conditions.push({
      OR: [
        {
          quantity_on_hand: {
            not: 0,
          },
        },
        {
          quantity_reserved: {
            not: 0,
          },
        },
      ],
    });
  }

  if (filters.variantId) {
    conditions.push({
      inventory_product_variant_id: filters.variantId,
    });
  }

  if (filters.productId) {
    conditions.push({
      variant: {
        inventory_product_id: filters.productId,
      },
    });
  }

  if (filters.locationId) {
    conditions.push({
      inventory_location_id: filters.locationId,
    });
  }

  if (filters.search) {
    conditions.push({
      OR: [
        {
          variant: {
            name: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          variant: {
            product: {
              name: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          variant: {
            product: {
              brand: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          variant: {
            product: {
              model: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          variant: {
            codes: {
              some: {
                code: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          location: {
            location_code: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          location: {
            name: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  return conditions.length > 0
    ? {
        AND: conditions,
      }
    : {};
}

export function findInventoryStockBalances(
  filters: InventoryStockBalanceFilters,
) {
  return prisma.inventoryStockBalance.findMany({
    where: buildInventoryStockBalanceWhere(filters),
    include: inventoryStockBalanceInclude,
    orderBy: [
      {
        updated_at: "desc",
      },
      {
        inventory_stock_balance_id: "asc",
      },
    ],
  });
}

export function findInventoryStockBalanceDetailById(
  inventoryStockBalanceId: string,
) {
  return prisma.inventoryStockBalance.findUnique({
    where: {
      inventory_stock_balance_id: inventoryStockBalanceId,
    },
    include: inventoryStockBalanceInclude,
  });
}
