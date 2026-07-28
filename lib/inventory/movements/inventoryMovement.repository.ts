import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  InventoryMovementFilters,
  InventoryMovementQuery,
} from "./inventoryMovement.types";

const movementInclude = {
  document: true,

  document_line: {
    select: {
      inventory_document_line_id: true,
      line_number: true,
    },
  },

  variant: {
    include: {
      product: true,
      stock_unit: true,
    },
  },

  location: true,

  reversal_of_movement: {
    select: {
      inventory_movement_id: true,
      posting_key: true,
      movement_type: true,
      movement_at: true,
    },
  },

  reversal_movement: {
    select: {
      inventory_movement_id: true,
      posting_key: true,
      movement_type: true,
      movement_at: true,
    },
  },
} satisfies Prisma.InventoryMovementInclude;

function buildMovementWhere(
  filters: InventoryMovementFilters,
): Prisma.InventoryMovementWhereInput {
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

    ...(filters.inventoryProductId
      ? {
          variant: {
            inventory_product_id: filters.inventoryProductId,
          },
        }
      : {}),

    ...(filters.inventoryDocumentId
      ? {
          inventory_document_id: filters.inventoryDocumentId,
        }
      : {}),

    ...(filters.movementType
      ? {
          movement_type: filters.movementType,
        }
      : {}),

    ...(filters.dateFrom || filters.dateTo
      ? {
          movement_at: {
            ...(filters.dateFrom
              ? {
                  gte: filters.dateFrom,
                }
              : {}),

            ...(filters.dateTo
              ? {
                  lte: filters.dateTo,
                }
              : {}),
          },
        }
      : {}),

    ...(filters.search
      ? {
          OR: [
            {
              posting_key: {
                contains: filters.search,
                mode: "insensitive",
              },
            },

            {
              notes: {
                contains: filters.search,
                mode: "insensitive",
              },
            },

            {
              document: {
                document_number: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            },

            {
              document: {
                reference_number: {
                  contains: filters.search,
                  mode: "insensitive",
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
          ],
        }
      : {}),
  };
}

export function findInventoryMovements(query: InventoryMovementQuery) {
  const skip = (query.page - 1) * query.pageSize;

  return prisma.inventoryMovement.findMany({
    where: buildMovementWhere(query.filters),

    include: movementInclude,

    orderBy: [
      {
        movement_at: "desc",
      },
      {
        created_at: "desc",
      },
      {
        inventory_movement_id: "desc",
      },
    ],

    skip,
    take: query.pageSize,
  });
}

export function countInventoryMovements(filters: InventoryMovementFilters) {
  return prisma.inventoryMovement.count({
    where: buildMovementWhere(filters),
  });
}

export function findInventoryMovementById(inventoryMovementId: string) {
  return prisma.inventoryMovement.findUnique({
    where: {
      inventory_movement_id: inventoryMovementId,
    },

    include: movementInclude,
  });
}
