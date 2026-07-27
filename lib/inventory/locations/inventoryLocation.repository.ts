import { prisma } from "@/lib/prisma";

import type {
  InventoryLocationCreateData,
  InventoryLocationFilters,
  InventoryLocationUpdateData,
} from "./inventoryLocation.types";

const inventoryLocationSummarySelect = {
  inventory_location_id: true,
  location_code: true,
  name: true,
  location_type: true,
  allows_stock: true,
  is_active: true,
} as const;

export function findInventoryLocations(filters: InventoryLocationFilters) {
  return prisma.inventoryLocation.findMany({
    where: {
      ...(filters.activeOnly ? { is_active: true } : {}),
      ...(filters.rootOnly
        ? { parent_location_id: null }
        : filters.parentLocationId
          ? { parent_location_id: filters.parentLocationId }
          : {}),
      ...(filters.locationType ? { location_type: filters.locationType } : {}),
      ...(filters.countryCode ? { country_code: filters.countryCode } : {}),
      ...(filters.allowsStock !== undefined
        ? { allows_stock: filters.allowsStock }
        : {}),
      ...(filters.isDefault !== undefined
        ? { is_default: filters.isDefault }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                location_code: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                address_line: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                reference_point: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    include: {
      parent: {
        select: inventoryLocationSummarySelect,
      },
      _count: {
        select: {
          children: true,
          stock_balances: true,
        },
      },
    },
    orderBy: [
      {
        sort_order: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export function findInventoryLocationById(inventoryLocationId: string) {
  return prisma.inventoryLocation.findUnique({
    where: {
      inventory_location_id: inventoryLocationId,
    },
  });
}

export function findInventoryLocationDetailById(inventoryLocationId: string) {
  return prisma.inventoryLocation.findUnique({
    where: {
      inventory_location_id: inventoryLocationId,
    },
    include: {
      parent: {
        select: inventoryLocationSummarySelect,
      },
      children: {
        select: inventoryLocationSummarySelect,
        orderBy: [
          {
            sort_order: "asc",
          },
          {
            name: "asc",
          },
        ],
      },
      _count: {
        select: {
          children: true,
          stock_balances: true,
        },
      },
    },
  });
}

export function findInventoryLocationByCode(locationCode: string) {
  return prisma.inventoryLocation.findUnique({
    where: {
      location_code: locationCode,
    },
  });
}

export function findInventoryLocationParentLinkById(
  inventoryLocationId: string,
) {
  return prisma.inventoryLocation.findUnique({
    where: {
      inventory_location_id: inventoryLocationId,
    },
    select: {
      inventory_location_id: true,
      parent_location_id: true,
      is_active: true,
    },
  });
}

export function createInventoryLocationRecord(
  data: InventoryLocationCreateData,
) {
  return prisma.$transaction(async (transaction) => {
    if (data.is_default) {
      await transaction.inventoryLocation.updateMany({
        where: {
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
    }

    return transaction.inventoryLocation.create({
      data: {
        parent_location_id: data.parent_location_id,
        location_code: data.location_code,
        name: data.name,
        description: data.description,
        location_type: data.location_type,
        country_code: data.country_code,
        address_line: data.address_line,
        reference_point: data.reference_point,
        latitude: data.latitude,
        longitude: data.longitude,
        allows_stock: data.allows_stock,
        is_default: data.is_default,
        sort_order: data.sort_order,
        metadata: data.metadata,
        is_active: true,
      },
    });
  });
}

export function updateInventoryLocationRecord(
  inventoryLocationId: string,
  data: InventoryLocationUpdateData,
) {
  return prisma.$transaction(async (transaction) => {
    if (data.is_default === true) {
      await transaction.inventoryLocation.updateMany({
        where: {
          is_default: true,
          inventory_location_id: {
            not: inventoryLocationId,
          },
        },
        data: {
          is_default: false,
        },
      });
    }

    return transaction.inventoryLocation.update({
      where: {
        inventory_location_id: inventoryLocationId,
      },
      data,
    });
  });
}

export function deactivateInventoryLocationRecord(inventoryLocationId: string) {
  return prisma.inventoryLocation.update({
    where: {
      inventory_location_id: inventoryLocationId,
    },
    data: {
      is_active: false,
      is_default: false,
    },
  });
}

export function countActiveInventoryLocationChildren(
  inventoryLocationId: string,
) {
  return prisma.inventoryLocation.count({
    where: {
      parent_location_id: inventoryLocationId,
      is_active: true,
    },
  });
}

export function getInventoryLocationStockTotals(inventoryLocationId: string) {
  return prisma.inventoryStockBalance.aggregate({
    where: {
      inventory_location_id: inventoryLocationId,
    },
    _sum: {
      quantity_on_hand: true,
      quantity_reserved: true,
    },
  });
}
