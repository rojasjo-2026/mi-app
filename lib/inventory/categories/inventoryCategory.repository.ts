import { prisma } from "@/lib/prisma";

import type {
  InventoryCategoryCreateData,
  InventoryCategoryFilters,
  InventoryCategoryUpdateData,
} from "./inventoryCategory.types";

const categorySummarySelect = {
  inventory_category_id: true,
  category_code: true,
  name: true,
  is_active: true,
} as const;

export function findInventoryCategories(filters: InventoryCategoryFilters) {
  return prisma.inventoryCategory.findMany({
    where: {
      ...(filters.activeOnly ? { is_active: true } : {}),
      ...(filters.rootOnly
        ? { parent_category_id: null }
        : filters.parentCategoryId
          ? { parent_category_id: filters.parentCategoryId }
          : {}),
      ...(filters.search
        ? {
            OR: [
              {
                category_code: {
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
            ],
          }
        : {}),
    },
    include: {
      parent: {
        select: categorySummarySelect,
      },
      _count: {
        select: {
          children: true,
          products: true,
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

export function findInventoryCategoryById(inventoryCategoryId: string) {
  return prisma.inventoryCategory.findUnique({
    where: {
      inventory_category_id: inventoryCategoryId,
    },
  });
}

export function findInventoryCategoryDetailById(inventoryCategoryId: string) {
  return prisma.inventoryCategory.findUnique({
    where: {
      inventory_category_id: inventoryCategoryId,
    },
    include: {
      parent: {
        select: categorySummarySelect,
      },
      children: {
        select: categorySummarySelect,
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
          products: true,
        },
      },
    },
  });
}

export function findInventoryCategoryByCode(categoryCode: string) {
  return prisma.inventoryCategory.findUnique({
    where: {
      category_code: categoryCode,
    },
  });
}

export function findInventoryCategoryParentLinkById(
  inventoryCategoryId: string,
) {
  return prisma.inventoryCategory.findUnique({
    where: {
      inventory_category_id: inventoryCategoryId,
    },
    select: {
      inventory_category_id: true,
      parent_category_id: true,
      is_active: true,
    },
  });
}

export function createInventoryCategoryRecord(
  data: InventoryCategoryCreateData,
) {
  return prisma.inventoryCategory.create({
    data: {
      category_code: data.category_code,
      name: data.name,
      description: data.description,
      parent_category_id: data.parent_category_id,
      sort_order: data.sort_order,
      is_active: true,
    },
  });
}

export function updateInventoryCategoryRecord(
  inventoryCategoryId: string,
  data: InventoryCategoryUpdateData,
) {
  return prisma.inventoryCategory.update({
    where: {
      inventory_category_id: inventoryCategoryId,
    },
    data,
  });
}

export function deactivateInventoryCategoryRecord(inventoryCategoryId: string) {
  return prisma.inventoryCategory.update({
    where: {
      inventory_category_id: inventoryCategoryId,
    },
    data: {
      is_active: false,
    },
  });
}

export function countActiveInventoryCategoryChildren(
  inventoryCategoryId: string,
) {
  return prisma.inventoryCategory.count({
    where: {
      parent_category_id: inventoryCategoryId,
      is_active: true,
    },
  });
}
