import { InventoryReservationStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  InventoryReservationQuery,
  InventoryReservationQueryFilters,
} from "./inventoryReservationQuery.types";

const operationalExpirationStatuses: InventoryReservationStatus[] = [
  InventoryReservationStatus.DRAFT,
  InventoryReservationStatus.ACTIVE,
  InventoryReservationStatus.PARTIALLY_CONSUMED,
];

const reservationListInclude = {
  lines: {
    select: {
      inventory_reservation_line_id: true,
      inventory_product_variant_id: true,
      inventory_location_id: true,
      quantity_requested: true,
      quantity_reserved: true,
      quantity_consumed: true,
      quantity_released: true,

      variant: {
        select: {
          inventory_product_variant_id: true,
          name: true,

          product: {
            select: {
              inventory_product_id: true,
              name: true,
            },
          },
        },
      },

      location: {
        select: {
          inventory_location_id: true,
          location_code: true,
          name: true,
        },
      },
    },

    orderBy: {
      line_number: "asc",
    },
  },

  _count: {
    select: {
      events: true,
    },
  },
} satisfies Prisma.InventoryReservationInclude;

const consumptionDocumentSelect = {
  inventory_document_id: true,
  document_number: true,
  document_type: true,
  status: true,
  document_date: true,
  total_cost: true,
  posted_by: true,
  posted_at: true,
  created_at: true,

  _count: {
    select: {
      lines: true,
      movements: true,
    },
  },
} satisfies Prisma.InventoryDocumentSelect;

export type InventoryReservationListRecord =
  Prisma.InventoryReservationGetPayload<{
    include: typeof reservationListInclude;
  }>;

export type InventoryReservationConsumptionDocumentRecord =
  Prisma.InventoryDocumentGetPayload<{
    select: typeof consumptionDocumentSelect;
  }>;

function buildLineFilter(
  filters: InventoryReservationQueryFilters,
): Prisma.InventoryReservationLineWhereInput | null {
  if (
    !filters.inventoryLocationId &&
    !filters.inventoryProductVariantId &&
    !filters.inventoryProductId
  ) {
    return null;
  }

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
  };
}

function buildSearchFilter(
  search: string,
): Prisma.InventoryReservationWhereInput {
  return {
    OR: [
      {
        reservation_number: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        reference_type: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        reference_id: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        reference_number: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        notes: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        created_by: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        lines: {
          some: {
            OR: [
              {
                variant: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },

              {
                variant: {
                  product: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },

              {
                location: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },

              {
                location: {
                  location_code: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          },
        },
      },
    ],
  };
}

function buildExpirationFilter(
  query: InventoryReservationQuery,
): Prisma.InventoryReservationWhereInput | null {
  switch (query.filters.expirationFilter) {
    case "WITHOUT_DATE":
      return {
        expires_at: null,
      };

    case "OVERDUE":
      return {
        status: {
          in: operationalExpirationStatuses,
        },

        expires_at: {
          lte: query.asOf,
        },
      };

    case "UPCOMING": {
      const cutoff = new Date(
        query.asOf.getTime() + query.expiringWithinDays * 86_400_000,
      );

      return {
        status: {
          in: operationalExpirationStatuses,
        },

        expires_at: {
          gt: query.asOf,
          lte: cutoff,
        },
      };
    }

    default:
      return null;
  }
}

function buildReservationWhere(
  query: InventoryReservationQuery,
): Prisma.InventoryReservationWhereInput {
  const andFilters: Prisma.InventoryReservationWhereInput[] = [];

  const lineFilter = buildLineFilter(query.filters);

  if (lineFilter) {
    andFilters.push({
      lines: {
        some: lineFilter,
      },
    });
  }

  if (query.filters.search) {
    andFilters.push(buildSearchFilter(query.filters.search));
  }

  const expirationFilter = buildExpirationFilter(query);

  if (expirationFilter) {
    andFilters.push(expirationFilter);
  }

  return {
    ...(query.filters.statuses.length > 0
      ? {
          status: {
            in: query.filters.statuses,
          },
        }
      : {}),

    ...(query.filters.referenceType
      ? {
          reference_type: query.filters.referenceType,
        }
      : {}),

    ...(query.filters.referenceId
      ? {
          reference_id: query.filters.referenceId,
        }
      : {}),

    ...(query.filters.createdFrom || query.filters.createdTo
      ? {
          created_at: {
            ...(query.filters.createdFrom
              ? {
                  gte: query.filters.createdFrom,
                }
              : {}),

            ...(query.filters.createdTo
              ? {
                  lte: query.filters.createdTo,
                }
              : {}),
          },
        }
      : {}),

    ...(query.filters.expiresFrom || query.filters.expiresTo
      ? {
          expires_at: {
            ...(query.filters.expiresFrom
              ? {
                  gte: query.filters.expiresFrom,
                }
              : {}),

            ...(query.filters.expiresTo
              ? {
                  lte: query.filters.expiresTo,
                }
              : {}),
          },
        }
      : {}),

    ...(andFilters.length > 0
      ? {
          AND: andFilters,
        }
      : {}),
  };
}

function buildReservationOrderBy(
  query: InventoryReservationQuery,
): Prisma.InventoryReservationOrderByWithRelationInput[] {
  const direction = query.sortDirection;

  let primaryOrder: Prisma.InventoryReservationOrderByWithRelationInput;

  switch (query.sortBy) {
    case "reservation_number":
      primaryOrder = {
        reservation_number: direction,
      };
      break;

    case "status":
      primaryOrder = {
        status: direction,
      };
      break;

    case "expires_at":
      primaryOrder = {
        expires_at: direction,
      };
      break;

    case "updated_at":
      primaryOrder = {
        updated_at: direction,
      };
      break;

    default:
      primaryOrder = {
        created_at: direction,
      };
  }

  return [
    primaryOrder,
    {
      inventory_reservation_id: direction,
    },
  ];
}

export function findInventoryReservations(query: InventoryReservationQuery) {
  const skip = (query.page - 1) * query.pageSize;

  return prisma.inventoryReservation.findMany({
    where: buildReservationWhere(query),

    include: reservationListInclude,

    orderBy: buildReservationOrderBy(query),

    skip,
    take: query.pageSize,
  });
}

export function countInventoryReservations(query: InventoryReservationQuery) {
  return prisma.inventoryReservation.count({
    where: buildReservationWhere(query),
  });
}

export function findInventoryReservationConsumptionDocuments(
  inventoryReservationId: string,
) {
  return prisma.inventoryDocument.findMany({
    where: {
      reference_type: "INVENTORY_RESERVATION_CONSUMPTION",

      reference_id: inventoryReservationId,
    },

    select: consumptionDocumentSelect,

    orderBy: [
      {
        document_date: "desc",
      },

      {
        created_at: "desc",
      },
    ],
  });
}
