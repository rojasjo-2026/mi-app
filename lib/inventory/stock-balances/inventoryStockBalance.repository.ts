import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  InventoryStockBalanceFilters,
  InventoryStockBalanceQuery,
} from "./inventoryStockBalance.types";

const stockBalanceInclude = {
  location: true,

  variant: {
    include: {
      product: true,
      stock_unit: true,
    },
  },
} satisfies Prisma.InventoryStockBalanceInclude;

function buildVariantWhere(
  filters: InventoryStockBalanceFilters,
): Prisma.InventoryProductVariantWhereInput {
  return {
    ...(filters.inventoryProductId
      ? {
          inventory_product_id: filters.inventoryProductId,
        }
      : {}),

    ...(!filters.includeInactive
      ? {
          is_active: true,

          product: {
            is_active: true,
          },

          stock_unit: {
            is_active: true,
          },
        }
      : {}),
  };
}

function buildStockBalanceWhere(
  filters: InventoryStockBalanceFilters,
): Prisma.InventoryStockBalanceWhereInput {
  const variantWhere = buildVariantWhere(filters);

  return {
    ...(filters.inventoryLocationId
      ? {
          inventory_location_id: filters.inventoryLocationId,
        }
      : {}),

    ...(filters.inventoryProductVariantId
      ? {
          inventory_product_variant_id: filters.inventoryProductVariantId,
        }
      : {}),

    ...(filters.onlyWithStock
      ? {
          quantity_on_hand: {
            gt: 0,
          },
        }
      : {}),

    ...(filters.inventoryProductId || !filters.includeInactive
      ? {
          variant: variantWhere,
        }
      : {}),

    ...(!filters.includeInactive
      ? {
          location: {
            is_active: true,
          },
        }
      : {}),

    ...(filters.search
      ? {
          OR: [
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
                stock_unit: {
                  code: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
            },

            {
              variant: {
                stock_unit: {
                  name: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
}

export function findInventoryStockBalances(query: InventoryStockBalanceQuery) {
  const skip = (query.page - 1) * query.pageSize;

  return prisma.inventoryStockBalance.findMany({
    where: buildStockBalanceWhere(query.filters),

    include: stockBalanceInclude,

    orderBy: [
      {
        variant: {
          product: {
            name: "asc",
          },
        },
      },

      {
        variant: {
          name: "asc",
        },
      },

      {
        location: {
          name: "asc",
        },
      },
    ],

    skip,
    take: query.pageSize,
  });
}

export function countInventoryStockBalances(
  filters: InventoryStockBalanceFilters,
) {
  return prisma.inventoryStockBalance.count({
    where: buildStockBalanceWhere(filters),
  });
}
