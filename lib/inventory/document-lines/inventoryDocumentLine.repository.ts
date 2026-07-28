import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { InventoryDocumentLineResolvedData } from "./inventoryDocumentLine.types";

const productSelect = {
  inventory_product_id: true,
  name: true,
  product_type: true,
  tracking_mode: true,
  manages_stock: true,
  is_active: true,
} as const;

const unitSelect = {
  unit_of_measure_id: true,
  code: true,
  name: true,
  symbol: true,
  allows_decimal: true,
  decimal_scale: true,
  is_active: true,
} as const;

const codeSelect = {
  inventory_product_code_id: true,
  inventory_product_variant_id: true,
  unit_of_measure_id: true,
  code: true,
  code_type: true,
  quantity_in_stock_unit: true,
  is_primary: true,
  is_scannable: true,
  is_active: true,
} as const;

const variantSelect = {
  inventory_product_variant_id: true,
  inventory_product_id: true,
  stock_unit_id: true,
  name: true,
  is_default: true,
  is_active: true,
  product: {
    select: productSelect,
  },
} as const;

const lineInclude = {
  variant: {
    select: variantSelect,
  },
  product_code: {
    select: codeSelect,
  },
  unit_of_measure: {
    select: unitSelect,
  },
} as const;

async function updateDocumentTotalCost(
  transaction: Prisma.TransactionClient,
  inventoryDocumentId: string,
) {
  const totals = await transaction.inventoryDocumentLine.aggregate({
    where: {
      inventory_document_id: inventoryDocumentId,
    },
    _sum: {
      total_cost: true,
    },
  });

  await transaction.inventoryDocument.update({
    where: {
      inventory_document_id: inventoryDocumentId,
    },
    data: {
      total_cost: totals._sum.total_cost ?? new Prisma.Decimal(0),
    },
  });
}

export function findInventoryDocumentLineById(inventoryDocumentLineId: string) {
  return prisma.inventoryDocumentLine.findUnique({
    where: {
      inventory_document_line_id: inventoryDocumentLineId,
    },
  });
}

export function findInventoryDocumentLineDetailById(
  inventoryDocumentLineId: string,
) {
  return prisma.inventoryDocumentLine.findUnique({
    where: {
      inventory_document_line_id: inventoryDocumentLineId,
    },
    include: lineInclude,
  });
}

export function findInventoryDocumentLineVariantContext(
  inventoryProductVariantId: string,
) {
  return prisma.inventoryProductVariant.findUnique({
    where: {
      inventory_product_variant_id: inventoryProductVariantId,
    },
    include: {
      product: {
        select: productSelect,
      },
      stock_unit: {
        select: unitSelect,
      },
    },
  });
}

export function findInventoryDocumentLineCodeContext(
  inventoryProductCodeId: string,
) {
  return prisma.inventoryProductCode.findUnique({
    where: {
      inventory_product_code_id: inventoryProductCodeId,
    },
    select: codeSelect,
  });
}

export function findInventoryDocumentLineUnitContext(unitOfMeasureId: string) {
  return prisma.unitOfMeasure.findUnique({
    where: {
      unit_of_measure_id: unitOfMeasureId,
    },
    select: unitSelect,
  });
}

export function createInventoryDocumentLineRecord(
  inventoryDocumentId: string,
  data: InventoryDocumentLineResolvedData,
) {
  return prisma.$transaction(
    async (transaction) => {
      const currentLine = await transaction.inventoryDocumentLine.aggregate({
        where: {
          inventory_document_id: inventoryDocumentId,
        },
        _max: {
          line_number: true,
        },
      });

      const line = await transaction.inventoryDocumentLine.create({
        data: {
          inventory_document_id: inventoryDocumentId,
          inventory_product_variant_id: data.inventory_product_variant_id,
          inventory_product_code_id: data.inventory_product_code_id,
          unit_of_measure_id: data.unit_of_measure_id,
          line_number: (currentLine._max.line_number ?? 0) + 1,
          quantity: data.quantity,
          conversion_factor: data.conversion_factor,
          stock_quantity: data.stock_quantity,
          received_stock_quantity: "0",
          unit_cost: data.unit_cost,
          total_cost: data.total_cost,
          product_name_snapshot: data.product_name_snapshot,
          variant_name_snapshot: data.variant_name_snapshot,
          unit_code_snapshot: data.unit_code_snapshot,
          code_snapshot: data.code_snapshot,
          notes: data.notes,
        },
      });

      await updateDocumentTotalCost(transaction, inventoryDocumentId);

      return line;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export function updateInventoryDocumentLineRecord(
  inventoryDocumentLineId: string,
  inventoryDocumentId: string,
  data: InventoryDocumentLineResolvedData,
) {
  return prisma.$transaction(
    async (transaction) => {
      const line = await transaction.inventoryDocumentLine.update({
        where: {
          inventory_document_line_id: inventoryDocumentLineId,
        },
        data: {
          inventory_product_variant_id: data.inventory_product_variant_id,
          inventory_product_code_id: data.inventory_product_code_id,
          unit_of_measure_id: data.unit_of_measure_id,
          quantity: data.quantity,
          conversion_factor: data.conversion_factor,
          stock_quantity: data.stock_quantity,
          unit_cost: data.unit_cost,
          total_cost: data.total_cost,
          product_name_snapshot: data.product_name_snapshot,
          variant_name_snapshot: data.variant_name_snapshot,
          unit_code_snapshot: data.unit_code_snapshot,
          code_snapshot: data.code_snapshot,
          notes: data.notes,
        },
      });

      await updateDocumentTotalCost(transaction, inventoryDocumentId);

      return line;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export function deleteInventoryDocumentLineRecord(
  inventoryDocumentLineId: string,
  inventoryDocumentId: string,
) {
  return prisma.$transaction(
    async (transaction) => {
      const line = await transaction.inventoryDocumentLine.delete({
        where: {
          inventory_document_line_id: inventoryDocumentLineId,
        },
      });

      await updateDocumentTotalCost(transaction, inventoryDocumentId);

      return line;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
