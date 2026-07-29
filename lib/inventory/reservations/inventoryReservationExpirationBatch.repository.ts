import { InventoryReservationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { expireInventoryReservationRecord } from "./inventoryReservationExpiration.repository";

import {
  InventoryReservationExpirationError,
  type InventoryReservationExpirationBatchInput,
  type InventoryReservationExpirationBatchItem,
  type InventoryReservationExpirationBatchResponse,
} from "./inventoryReservationExpiration.types";

async function findDueReservationIds(asOf: Date, limit: number) {
  return prisma.inventoryReservation.findMany({
    where: {
      status: {
        in: [
          InventoryReservationStatus.ACTIVE,
          InventoryReservationStatus.PARTIALLY_CONSUMED,
        ],
      },

      expires_at: {
        lte: asOf,
      },
    },

    select: {
      inventory_reservation_id: true,
    },

    orderBy: [
      {
        expires_at: "asc",
      },

      {
        created_at: "asc",
      },
    ],

    take: limit,
  });
}

export async function expireDueInventoryReservationRecords(
  input: InventoryReservationExpirationBatchInput,
): Promise<InventoryReservationExpirationBatchResponse> {
  const asOf = new Date();

  const candidates = await findDueReservationIds(asOf, input.limit);

  const items: InventoryReservationExpirationBatchItem[] = [];

  let expired = 0;

  let alreadyExpired = 0;

  let failed = 0;

  for (const candidate of candidates) {
    try {
      const result = await expireInventoryReservationRecord(
        candidate.inventory_reservation_id,
        {
          expirationReason: input.expirationReason,

          expiredBy: input.expiredBy,
        },
        asOf,
      );

      if (result.outcome === "EXPIRED") {
        expired += 1;
      } else {
        alreadyExpired += 1;
      }

      items.push({
        inventory_reservation_id: result.inventoryReservationId,

        outcome: result.outcome,

        quantity_released: result.quantityReleased,

        error_code: null,

        message:
          result.outcome === "EXPIRED"
            ? "Reserva vencida correctamente."
            : "La reserva ya estaba vencida.",
      });
    } catch (error) {
      failed += 1;

      if (error instanceof InventoryReservationExpirationError) {
        items.push({
          inventory_reservation_id: candidate.inventory_reservation_id,

          outcome: "FAILED",

          quantity_released: null,

          error_code: error.code,

          message: error.message,
        });

        continue;
      }

      console.error(
        "Inventory reservation batch expiration item error:",
        error,
      );

      items.push({
        inventory_reservation_id: candidate.inventory_reservation_id,

        outcome: "FAILED",

        quantity_released: null,

        error_code: null,

        message: "Ocurrió un error inesperado al vencer la reserva.",
      });
    }
  }

  return {
    as_of: asOf.toISOString(),

    matched: candidates.length,

    expired,

    already_expired: alreadyExpired,

    failed,

    items,
  };
}
