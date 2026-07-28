import { InventoryDocumentStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  InventoryDocumentCreateData,
  InventoryDocumentFilters,
  InventoryDocumentUpdateData,
} from "./inventoryDocument.types";

const locationSelect = {
  inventory_location_id: true,
  location_code: true,
  name: true,
  location_type: true,
  allows_stock: true,
  is_active: true,
} as const;

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

const documentListInclude = {
  source_location: {
    select: locationSelect,
  },
  destination_location: {
    select: locationSelect,
  },
  _count: {
    select: {
      lines: true,
      movements: true,
    },
  },
} as const;

const documentDetailInclude = {
  ...documentListInclude,
  lines: {
    include: {
      variant: {
        select: variantSelect,
      },
      product_code: {
        select: codeSelect,
      },
      unit_of_measure: {
        select: unitSelect,
      },
    },
    orderBy: {
      line_number: "asc",
    },
  },
} as const;

function buildDocumentWhere(
  filters: InventoryDocumentFilters,
): Prisma.InventoryDocumentWhereInput {
  return {
    ...(filters.documentType
      ? {
          document_type: filters.documentType,
        }
      : {}),
    ...(filters.status
      ? {
          status: filters.status,
        }
      : {}),
    ...(filters.sourceLocationId
      ? {
          source_location_id: filters.sourceLocationId,
        }
      : {}),
    ...(filters.destinationLocationId
      ? {
          destination_location_id: filters.destinationLocationId,
        }
      : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          document_date: {
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
              document_number: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              reference_number: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              reference_type: {
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
          ],
        }
      : {}),
  };
}

export function findInventoryDocuments(filters: InventoryDocumentFilters) {
  return prisma.inventoryDocument.findMany({
    where: buildDocumentWhere(filters),
    include: documentListInclude,
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

export function findInventoryDocumentById(inventoryDocumentId: string) {
  return prisma.inventoryDocument.findUnique({
    where: {
      inventory_document_id: inventoryDocumentId,
    },
  });
}

export function findInventoryDocumentDetailById(inventoryDocumentId: string) {
  return prisma.inventoryDocument.findUnique({
    where: {
      inventory_document_id: inventoryDocumentId,
    },
    include: documentDetailInclude,
  });
}

export function findInventoryDocumentByIdempotencyKey(idempotencyKey: string) {
  return prisma.inventoryDocument.findUnique({
    where: {
      idempotency_key: idempotencyKey,
    },
    include: documentDetailInclude,
  });
}

export function findInventoryDocumentLocationById(inventoryLocationId: string) {
  return prisma.inventoryLocation.findUnique({
    where: {
      inventory_location_id: inventoryLocationId,
    },
  });
}

export function createInventoryDocumentRecord(
  documentNumber: string,
  data: InventoryDocumentCreateData,
) {
  return prisma.inventoryDocument.create({
    data: {
      document_number: documentNumber,
      document_type: data.document_type,
      status: InventoryDocumentStatus.DRAFT,
      source_location_id: data.source_location_id,
      destination_location_id: data.destination_location_id,
      document_date: data.document_date,
      reference_type: data.reference_type,
      reference_id: data.reference_id,
      reference_number: data.reference_number,
      idempotency_key: data.idempotency_key,
      total_cost: "0",
      notes: data.notes,
      created_by: data.created_by,
    },
  });
}

export function updateInventoryDocumentRecord(
  inventoryDocumentId: string,
  data: InventoryDocumentUpdateData,
) {
  return prisma.inventoryDocument.update({
    where: {
      inventory_document_id: inventoryDocumentId,
    },
    data,
  });
}

export function countInventoryDocumentLines(inventoryDocumentId: string) {
  return prisma.inventoryDocumentLine.count({
    where: {
      inventory_document_id: inventoryDocumentId,
    },
  });
}
