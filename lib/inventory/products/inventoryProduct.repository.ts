import { prisma } from "@/lib/prisma";

import type {
  InventoryProductCreateData,
  InventoryProductFilters,
  InventoryProductUpdateData,
} from "./inventoryProduct.types";

const inventoryProductCategorySelect = {
  inventory_category_id: true,
  category_code: true,
  name: true,
  is_active: true,
} as const;

const inventoryProductVariantUnitSelect = {
  unit_of_measure_id: true,
  code: true,
  name: true,
  symbol: true,
  allows_decimal: true,
  decimal_scale: true,
  is_active: true,
} as const;

export function findInventoryProducts(filters: InventoryProductFilters) {
  return prisma.inventoryProduct.findMany({
    where: {
      ...(filters.activeOnly ? { is_active: true } : {}),
      ...(filters.categoryId
        ? { inventory_category_id: filters.categoryId }
        : {}),
      ...(filters.productType ? { product_type: filters.productType } : {}),
      ...(filters.trackingMode ? { tracking_mode: filters.trackingMode } : {}),
      ...(filters.managesStock !== undefined
        ? { manages_stock: filters.managesStock }
        : {}),
      ...(filters.brand
        ? {
            brand: {
              contains: filters.brand,
              mode: "insensitive",
            },
          }
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
                description: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                brand: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                model: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                variants: {
                  some: {
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
              },
            ],
          }
        : {}),
    },
    include: {
      category: {
        select: inventoryProductCategorySelect,
      },
      _count: {
        select: {
          variants: true,
        },
      },
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        created_at: "asc",
      },
    ],
  });
}

export function findInventoryProductById(inventoryProductId: string) {
  return prisma.inventoryProduct.findUnique({
    where: {
      inventory_product_id: inventoryProductId,
    },
  });
}

export function findInventoryProductDetailById(inventoryProductId: string) {
  return prisma.inventoryProduct.findUnique({
    where: {
      inventory_product_id: inventoryProductId,
    },
    include: {
      category: {
        select: inventoryProductCategorySelect,
      },
      variants: {
        include: {
          stock_unit: {
            select: inventoryProductVariantUnitSelect,
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
      },
      _count: {
        select: {
          variants: true,
        },
      },
    },
  });
}

export function findInventoryProductCategoryById(inventoryCategoryId: string) {
  return prisma.inventoryCategory.findUnique({
    where: {
      inventory_category_id: inventoryCategoryId,
    },
  });
}

export function createInventoryProductRecord(data: InventoryProductCreateData) {
  return prisma.$transaction(async (transaction) => {
    return transaction.inventoryProduct.create({
      data: {
        inventory_category_id: data.inventory_category_id,
        name: data.name,
        description: data.description,
        brand: data.brand,
        model: data.model,
        product_type: data.product_type,
        tracking_mode: data.tracking_mode,
        manages_stock: data.manages_stock,
        has_expiration: data.has_expiration,
        allow_negative_stock: data.allow_negative_stock,
        tax_exempt: data.tax_exempt,
        tax_rate: data.tax_rate,
        attributes: data.attributes,
        is_active: true,
        variants: {
          create: {
            stock_unit_id: data.default_variant.stock_unit_id,
            name: data.default_variant.name,
            attributes: data.default_variant.attributes,
            default_cost: data.default_variant.default_cost,
            default_price: data.default_variant.default_price,
            minimum_stock: data.default_variant.minimum_stock,
            maximum_stock: data.default_variant.maximum_stock,
            is_default: true,
            sort_order: data.default_variant.sort_order,
            is_active: true,
          },
        },
      },
    });
  });
}

export function updateInventoryProductRecord(
  inventoryProductId: string,
  data: InventoryProductUpdateData,
) {
  return prisma.inventoryProduct.update({
    where: {
      inventory_product_id: inventoryProductId,
    },
    data,
  });
}

export function deactivateInventoryProductRecord(inventoryProductId: string) {
  return prisma.inventoryProduct.update({
    where: {
      inventory_product_id: inventoryProductId,
    },
    data: {
      is_active: false,
    },
  });
}
export function getInventoryProductStockTotals(inventoryProductId: string) {
  return prisma.inventoryStockBalance.aggregate({
    where: {
      variant: {
        inventory_product_id: inventoryProductId,
      },
    },
    _sum: {
      quantity_on_hand: true,
      quantity_reserved: true,
    },
  });
}
