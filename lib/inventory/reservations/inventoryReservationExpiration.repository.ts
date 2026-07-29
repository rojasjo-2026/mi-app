import {
  InventoryReservationEventType,
  InventoryReservationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  expireInventoryReservationLine,
  expirationReservationInclude,
  toExpirationDecimal,
  validateExpirationLineAccounting,
  type ExpirationTransaction,
} from "./inventoryReservationExpirationLine.repository";

import {
  InventoryReservationExpirationError,
  type InventoryReservationExpirationInput,
  type InventoryReservationExpirationTransactionResult,
} from "./inventoryReservationExpiration.types";

const MAX_TRANSACTION_ATTEMPTS = 3;

async function executeExpirationTransaction(
  transaction: ExpirationTransaction,
  inventoryReservationId: string,
  input: InventoryReservationExpirationInput,
  expirationTimestamp: Date,
): Promise<InventoryReservationExpirationTransactionResult> {
  const reservation = await transaction.inventoryReservation.findUnique({
    where: {
      inventory_reservation_id: inventoryReservationId,
    },

    include: expirationReservationInclude,
  });

  if (!reservation) {
    throw new InventoryReservationExpirationError(
      "RESERVATION_NOT_FOUND",
      "La reserva de inventario no existe.",
      {
        inventory_reservation_id: "No se encontró la reserva solicitada.",
      },
    );
  }

  if (reservation.status === InventoryReservationStatus.EXPIRED) {
    return {
      inventoryReservationId: reservation.inventory_reservation_id,

      reservationStatus: reservation.status,

      outcome: "ALREADY_EXPIRED",

      quantityReleased: "0",
    };
  }

  const expirableStatuses: InventoryReservationStatus[] = [
    InventoryReservationStatus.ACTIVE,
    InventoryReservationStatus.PARTIALLY_CONSUMED,
  ];

  if (!expirableStatuses.includes(reservation.status)) {
    throw new InventoryReservationExpirationError(
      "INVALID_RESERVATION_STATUS",
      `La reserva con estado ${reservation.status} no puede vencerse.`,
      {
        status:
          "Solo las reservas activas o parcialmente consumidas pueden vencerse.",
      },
    );
  }

  if (!reservation.expires_at) {
    throw new InventoryReservationExpirationError(
      "EXPIRATION_DATE_REQUIRED",
      "La reserva no tiene una fecha de vencimiento.",
      {
        expires_at:
          "Defina una fecha de vencimiento antes de procesar la reserva.",
      },
    );
  }

  if (reservation.expires_at.getTime() > expirationTimestamp.getTime()) {
    throw new InventoryReservationExpirationError(
      "RESERVATION_NOT_DUE",
      "La reserva todavía no alcanzó su fecha de vencimiento.",
      {
        expires_at:
          "La reserva solo puede vencerse cuando llegue su fecha configurada.",
      },
    );
  }

  for (const line of reservation.lines) {
    validateExpirationLineAccounting(line);
  }

  const totalReservedBefore = reservation.lines.reduce(
    (total, line) => total.plus(line.quantity_reserved),
    toExpirationDecimal(0),
  );

  if (totalReservedBefore.lte(0)) {
    throw new InventoryReservationExpirationError(
      "NO_RESERVED_QUANTITY",
      "La reserva no contiene cantidades pendientes por liberar.",
      {
        reservation:
          "Una reserva activa debe mantener al menos una cantidad reservada.",
      },
    );
  }

  let quantityReleased = toExpirationDecimal(0);

  let releasedLineCount = 0;

  for (const line of reservation.lines) {
    const lineQuantityReleased = await expireInventoryReservationLine(
      transaction,
      reservation,
      line,
      expirationTimestamp,
      input,
    );

    quantityReleased = quantityReleased.plus(lineQuantityReleased);

    if (lineQuantityReleased.gt(0)) {
      releasedLineCount += 1;
    }
  }

  if (quantityReleased.lte(0)) {
    throw new InventoryReservationExpirationError(
      "NO_RESERVED_QUANTITY",
      "La reserva no contiene cantidades pendientes por liberar.",
      {
        reservation: "No se encontró inventario reservado para procesar.",
      },
    );
  }

  const reservationUpdate = await transaction.inventoryReservation.updateMany({
    where: {
      inventory_reservation_id: reservation.inventory_reservation_id,

      status: reservation.status,
    },

    data: {
      status: InventoryReservationStatus.EXPIRED,

      expired_by: input.expiredBy,

      expired_at: expirationTimestamp,
    },
  });

  if (reservationUpdate.count !== 1) {
    throw new InventoryReservationExpirationError(
      "TRANSACTION_CONFLICT",
      "La reserva cambió durante el vencimiento.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,

      inventory_reservation_line_id: null,

      event_type: InventoryReservationEventType.EXPIRED,

      previous_status: reservation.status,

      new_status: InventoryReservationStatus.EXPIRED,

      quantity: quantityReleased,

      reference_type: reservation.reference_type,

      reference_id: reservation.reference_id,

      reference_number: reservation.reference_number,

      reason: input.expirationReason,

      metadata: {
        expiration_timestamp: expirationTimestamp.toISOString(),

        configured_expires_at: reservation.expires_at.toISOString(),

        line_count: reservation.lines.length,

        released_line_count: releasedLineCount,

        quantity_released_total: quantityReleased.toString(),

        previous_status: reservation.status,
      },

      created_by: input.expiredBy,
    },
  });

  return {
    inventoryReservationId: reservation.inventory_reservation_id,

    reservationStatus: InventoryReservationStatus.EXPIRED,

    outcome: "EXPIRED",

    quantityReleased: quantityReleased.toString(),
  };
}

function isRetryableExpirationError(error: unknown) {
  if (
    error instanceof InventoryReservationExpirationError &&
    error.code === "TRANSACTION_CONFLICT"
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2034";
  }

  return false;
}

export async function expireInventoryReservationRecord(
  inventoryReservationId: string,
  input: InventoryReservationExpirationInput,
  expirationTimestamp = new Date(),
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executeExpirationTransaction(
            transaction,
            inventoryReservationId,
            input,
            expirationTimestamp,
          ),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      lastError = error;

      if (
        !isRetryableExpirationError(error) ||
        attempt === MAX_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw (
    lastError ?? new Error("No fue posible vencer la reserva de inventario.")
  );
}
