import { prisma } from "@/lib/prisma";

import type {
  InventoryCodeCreateData,
  InventoryCodeFilters,
  InventoryCodeUpdateData,
} from "./inventoryCode.types";

const inventoryCodeUnitSelect = {
  unit_of_measure_id: true,
  code: true,
  name: true,
  symbol: true,
  allows_decimal: true,
  decimal_scale: true,
  is_active: true,
} as const;

export function findInventoryCodes(filters: InventoryCodeFilters) {
  return prisma.inventoryProductCode.findMany({
    where: {
      ...(filters.activeOnly ? { is_active: true } : {}),
      ...(filters.variantId
        ? {
            inventory_product_variant_id: filters.variantId,
          }
        : {}),
      ...(filters.unitOfMeasureId
        ? {
            unit_of_measure_id: filters.unitOfMeasureId,
          }
        : {}),
      ...(filters.codeType ? { code_type: filters.codeType } : {}),
      ...(filters.isPrimary !== undefined
        ? { is_primary: filters.isPrimary }
        : {}),
      ...(filters.isScannable !== undefined
        ? { is_scannable: filters.isScannable }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                code: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                label: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    include: {
      unit_of_measure: {
        select: inventoryCodeUnitSelect,
      },
    },
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
  });
}

export function findInventoryCodeById(inventoryProductCodeId: string) {
  return prisma.inventoryProductCode.findUnique({
    where: {
      inventory_product_code_id: inventoryProductCodeId,
    },
  });
}

export function findInventoryCodeDetailById(inventoryProductCodeId: string) {
  return prisma.inventoryProductCode.findUnique({
    where: {
      inventory_product_code_id: inventoryProductCodeId,
    },
    include: {
      unit_of_measure: {
        select: inventoryCodeUnitSelect,
      },
    },
  });
}

export function findInventoryCodeByValue(code: string) {
  return prisma.inventoryProductCode.findUnique({
    where: {
      code,
    },
  });
}

export function findInventoryCodeUnitById(unitOfMeasureId: string) {
  return prisma.unitOfMeasure.findUnique({
    where: {
      unit_of_measure_id: unitOfMeasureId,
    },
  });
}

export function createInventoryCodeRecord(
  inventoryProductVariantId: string,
  data: InventoryCodeCreateData,
) {
  return prisma.$transaction(async (transaction) => {
    if (data.is_primary) {
      await transaction.inventoryProductCode.updateMany({
        where: {
          inventory_product_variant_id: inventoryProductVariantId,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });
    }

    return transaction.inventoryProductCode.create({
      data: {
        inventory_product_variant_id: inventoryProductVariantId,
        unit_of_measure_id: data.unit_of_measure_id,
        code: data.code,
        code_type: data.code_type,
        label: data.label,
        quantity_in_stock_unit: data.quantity_in_stock_unit,
        is_primary: data.is_primary,
        is_scannable: data.is_scannable,
        is_active: true,
      },
    });
  });
}

export function updateInventoryCodeRecord(
  inventoryProductCodeId: string,
  inventoryProductVariantId: string,
  data: InventoryCodeUpdateData,
) {
  return prisma.$transaction(async (transaction) => {
    if (data.is_primary === true) {
      await transaction.inventoryProductCode.updateMany({
        where: {
          inventory_product_variant_id: inventoryProductVariantId,
          inventory_product_code_id: {
            not: inventoryProductCodeId,
          },
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });
    }

    return transaction.inventoryProductCode.update({
      where: {
        inventory_product_code_id: inventoryProductCodeId,
      },
      data,
    });
  });
}

export function deactivateInventoryCodeRecord(
  inventoryProductCodeId: string,
  inventoryProductVariantId: string,
  data: InventoryCodeUpdateData = {},
  replacementPrimaryCodeId: string | null = null,
) {
  return prisma.$transaction(async (transaction) => {
    const deactivatedCode = await transaction.inventoryProductCode.update({
      where: {
        inventory_product_code_id: inventoryProductCodeId,
      },
      data: {
        ...data,
        is_active: false,
        is_primary: false,
      },
    });

    if (replacementPrimaryCodeId) {
      await transaction.inventoryProductCode.updateMany({
        where: {
          inventory_product_variant_id: inventoryProductVariantId,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });

      await transaction.inventoryProductCode.update({
        where: {
          inventory_product_code_id: replacementPrimaryCodeId,
        },
        data: {
          is_primary: true,
        },
      });
    }

    return deactivatedCode;
  });
}

export function findActivePrimaryInventoryCode(
  inventoryProductVariantId: string,
) {
  return prisma.inventoryProductCode.findFirst({
    where: {
      inventory_product_variant_id: inventoryProductVariantId,
      is_active: true,
      is_primary: true,
    },
  });
}
export function findAnotherActiveInventoryCode(
  inventoryProductVariantId: string,
  excludedCodeId: string,
) {
  return prisma.inventoryProductCode.findFirst({
    where: {
      inventory_product_variant_id: inventoryProductVariantId,
      inventory_product_code_id: {
        not: excludedCodeId,
      },
      is_active: true,
    },
    orderBy: [
      {
        is_scannable: "desc",
      },
      {
        code_type: "asc",
      },
      {
        created_at: "asc",
      },
    ],
  });
}

export function setInventoryCodeAsPrimary(
  inventoryProductVariantId: string,
  inventoryProductCodeId: string,
) {
  return prisma.$transaction(async (transaction) => {
    await transaction.inventoryProductCode.updateMany({
      where: {
        inventory_product_variant_id: inventoryProductVariantId,
        is_primary: true,
      },
      data: {
        is_primary: false,
      },
    });

    return transaction.inventoryProductCode.update({
      where: {
        inventory_product_code_id: inventoryProductCodeId,
      },
      data: {
        is_primary: true,
      },
    });
  });
}

export function countActiveInventoryVariantCodes(
  inventoryProductVariantId: string,
) {
  return prisma.inventoryProductCode.count({
    where: {
      inventory_product_variant_id: inventoryProductVariantId,
      is_active: true,
    },
  });
}
