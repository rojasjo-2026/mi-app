import {
  InventoryReservationEventType,
  InventoryReservationStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { InventoryReservationCreateData } from "./inventoryReservation.types";

const productSelect = {
  inventory_product_id: true,
  name: true,
  product_type: true,
  tracking_mode: true,
  manages_stock: true,
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

const locationSelect = {
  inventory_location_id: true,
  location_code: true,
  name: true,
  location_type: true,
  allows_stock: true,
  is_active: true,
} as const;

const reservationDetailInclude = {
  lines: {
    include: {
      variant: {
        select: variantSelect,
      },
      location: {
        select: locationSelect,
      },
    },
    orderBy: {
      line_number: "asc",
    },
  },
  events: {
    orderBy: [
      {
        created_at: "asc",
      },
      {
        inventory_reservation_event_id: "asc",
      },
    ],
  },
} satisfies Prisma.InventoryReservationInclude;

export function findInventoryReservationDetailById(
  inventoryReservationId: string,
) {
  return prisma.inventoryReservation.findUnique({
    where: {
      inventory_reservation_id: inventoryReservationId,
    },
    include: reservationDetailInclude,
  });
}

export function findInventoryReservationByIdempotencyKey(
  idempotencyKey: string,
) {
  return prisma.inventoryReservation.findUnique({
    where: {
      idempotency_key: idempotencyKey,
    },
    include: reservationDetailInclude,
  });
}

export function findInventoryReservationVariantsByIds(
  inventoryProductVariantIds: string[],
) {
  return prisma.inventoryProductVariant.findMany({
    where: {
      inventory_product_variant_id: {
        in: inventoryProductVariantIds,
      },
    },
    select: variantSelect,
  });
}

export function findInventoryReservationLocationsByIds(
  inventoryLocationIds: string[],
) {
  return prisma.inventoryLocation.findMany({
    where: {
      inventory_location_id: {
        in: inventoryLocationIds,
      },
    },
    select: locationSelect,
  });
}

export function createInventoryReservationRecord(
  reservationNumber: string,
  data: InventoryReservationCreateData,
) {
  return prisma.inventoryReservation.create({
    data: {
      reservation_number: reservationNumber,
      status: InventoryReservationStatus.DRAFT,
      reference_type: data.reference_type,
      reference_id: data.reference_id,
      reference_number: data.reference_number,
      idempotency_key: data.idempotency_key,
      expires_at: data.expires_at,
      notes: data.notes,
      created_by: data.created_by,

      lines: {
        create: data.lines.map((line, index) => ({
          inventory_product_variant_id: line.inventory_product_variant_id,
          inventory_location_id: line.inventory_location_id,
          line_number: index + 1,
          quantity_requested: line.quantity_requested,
          quantity_reserved: "0",
          quantity_consumed: "0",
          quantity_released: "0",
          notes: line.notes,
        })),
      },

      events: {
        create: {
          event_type: InventoryReservationEventType.CREATED,
          previous_status: null,
          new_status: InventoryReservationStatus.DRAFT,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          reference_number: data.reference_number,
          created_by: data.created_by,
        },
      },
    },
    include: reservationDetailInclude,
  });
}
