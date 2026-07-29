import {
  InventoryReservationEventType,
  InventoryReservationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  InventoryReservationCancellationError,
  type InventoryReservationCancellationInput,
  type InventoryReservationCancellationTransactionResult,
} from "./inventoryReservationCancellation.types";

const MAX_TRANSACTION_ATTEMPTS = 3;

function toDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

function validateDraftLineState(line: {
  line_number: number;
  quantity_requested: Prisma.Decimal;
  quantity_reserved: Prisma.Decimal;
  quantity_consumed: Prisma.Decimal;
  quantity_released: Prisma.Decimal;
}) {
  const requested = toDecimal(line.quantity_requested);

  const reserved = toDecimal(line.quantity_reserved);

  const consumed = toDecimal(line.quantity_consumed);

  const released = toDecimal(line.quantity_released);

  if (requested.lte(0)) {
    throw new InventoryReservationCancellationError(
      "INVALID_LINE_STATE",
      `La línea ${line.line_number} contiene una cantidad solicitada inválida.`,
      {
        reservation:
          "Las líneas de una reserva deben mantener una cantidad solicitada mayor que cero.",
      },
    );
  }

  if (!reserved.isZero() || !consumed.isZero() || !released.isZero()) {
    throw new InventoryReservationCancellationError(
      "INVALID_LINE_STATE",
      `La línea ${line.line_number} ya contiene cantidades procesadas.`,
      {
        reservation:
          "Una reserva DRAFT no puede contener cantidades reservadas, consumidas o liberadas.",
      },
    );
  }
}

async function executeCancellationTransaction(
  transaction: Prisma.TransactionClient,
  inventoryReservationId: string,
  input: InventoryReservationCancellationInput,
  cancellationTimestamp: Date,
): Promise<InventoryReservationCancellationTransactionResult> {
  const reservation = await transaction.inventoryReservation.findUnique({
    where: {
      inventory_reservation_id: inventoryReservationId,
    },

    include: {
      lines: {
        orderBy: {
          line_number: "asc",
        },
      },
    },
  });

  if (!reservation) {
    throw new InventoryReservationCancellationError(
      "RESERVATION_NOT_FOUND",
      "La reserva de inventario no existe.",
      {
        inventory_reservation_id: "No se encontró la reserva solicitada.",
      },
    );
  }

  if (reservation.status === InventoryReservationStatus.CANCELLED) {
    return {
      inventoryReservationId: reservation.inventory_reservation_id,

      reservationStatus: reservation.status,

      outcome: "ALREADY_CANCELLED",
    };
  }

  if (reservation.status !== InventoryReservationStatus.DRAFT) {
    throw new InventoryReservationCancellationError(
      "INVALID_RESERVATION_STATUS",
      `La reserva con estado ${reservation.status} no puede cancelarse.`,
      {
        status: "Solo las reservas en estado DRAFT pueden cancelarse.",
      },
    );
  }

  if (reservation.lines.length === 0) {
    throw new InventoryReservationCancellationError(
      "INVALID_LINE_STATE",
      "La reserva no contiene líneas.",
      {
        reservation: "No puede cancelarse una reserva sin líneas válidas.",
      },
    );
  }

  for (const line of reservation.lines) {
    validateDraftLineState(line);
  }

  const totalRequested = reservation.lines.reduce(
    (total, line) => total.plus(line.quantity_requested),
    toDecimal(0),
  );

  const reservationUpdate = await transaction.inventoryReservation.updateMany({
    where: {
      inventory_reservation_id: reservation.inventory_reservation_id,

      status: InventoryReservationStatus.DRAFT,

      cancelled_at: null,
    },

    data: {
      status: InventoryReservationStatus.CANCELLED,

      cancelled_by: input.cancelledBy,

      cancelled_at: cancellationTimestamp,
    },
  });

  if (reservationUpdate.count !== 1) {
    throw new InventoryReservationCancellationError(
      "TRANSACTION_CONFLICT",
      "La reserva cambió durante la cancelación.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,

      inventory_reservation_line_id: null,

      event_type: InventoryReservationEventType.CANCELLED,

      previous_status: InventoryReservationStatus.DRAFT,

      new_status: InventoryReservationStatus.CANCELLED,

      quantity: null,

      reference_type: reservation.reference_type,

      reference_id: reservation.reference_id,

      reference_number: reservation.reference_number,

      reason: input.cancellationReason,

      metadata: {
        cancellation_timestamp: cancellationTimestamp.toISOString(),

        line_count: reservation.lines.length,

        quantity_requested_total: totalRequested.toString(),

        stock_balance_changed: false,
      },

      created_by: input.cancelledBy,
    },
  });

  return {
    inventoryReservationId: reservation.inventory_reservation_id,

    reservationStatus: InventoryReservationStatus.CANCELLED,

    outcome: "CANCELLED",
  };
}

function isRetryableCancellationError(error: unknown) {
  if (
    error instanceof InventoryReservationCancellationError &&
    error.code === "TRANSACTION_CONFLICT"
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2034";
  }

  return false;
}

export async function cancelInventoryReservationRecord(
  inventoryReservationId: string,
  input: InventoryReservationCancellationInput,
  cancellationTimestamp = new Date(),
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executeCancellationTransaction(
            transaction,
            inventoryReservationId,
            input,
            cancellationTimestamp,
          ),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      lastError = error;

      if (
        !isRetryableCancellationError(error) ||
        attempt === MAX_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw (
    lastError ?? new Error("No fue posible cancelar la reserva de inventario.")
  );
}
