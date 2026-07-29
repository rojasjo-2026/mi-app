import {
  InventoryDocumentStatus,
  InventoryDocumentType,
  InventoryReservationEventType,
  InventoryReservationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { generateInventoryDocumentNumber } from "../documents/inventoryDocumentNumber";

import {
  CONSUMPTION_REFERENCE_TYPE,
  consumeSelectedLine,
  consumptionReservationInclude,
  findExistingConsumptionDocument,
  matchesExistingConsumption,
  resolveSelectedConsumptionLines,
  roundMoney,
  toDecimal,
  validateReservationLineAccounting,
  validateSelectedConsumptionQuantities,
  type ConsumptionTransaction,
} from "./inventoryReservationConsumptionLine.repository";

import {
  InventoryReservationConsumptionError,
  type InventoryReservationConsumptionInput,
  type InventoryReservationConsumptionTransactionResult,
} from "./inventoryReservationConsumption.types";

const MAX_TRANSACTION_ATTEMPTS = 3;

function throwIdempotencyConflict(): never {
  throw new InventoryReservationConsumptionError(
    "IDEMPOTENCY_KEY_CONFLICT",
    "La llave de idempotencia ya fue utilizada para otra operación.",
    {
      idempotency_key:
        "Utilice la misma solicitud original o genere una llave diferente.",
    },
  );
}

async function executeConsumptionTransaction(
  transaction: ConsumptionTransaction,
  inventoryReservationId: string,
  input: InventoryReservationConsumptionInput,
  documentNumber: string,
): Promise<InventoryReservationConsumptionTransactionResult> {
  const reservation = await transaction.inventoryReservation.findUnique({
    where: {
      inventory_reservation_id: inventoryReservationId,
    },

    include: consumptionReservationInclude,
  });

  if (!reservation) {
    throw new InventoryReservationConsumptionError(
      "RESERVATION_NOT_FOUND",
      "La reserva de inventario no existe.",
      {
        inventory_reservation_id: "No se encontró la reserva solicitada.",
      },
    );
  }

  const existingDocument = await findExistingConsumptionDocument(
    transaction,
    input.idempotencyKey,
  );

  if (
    existingDocument &&
    (existingDocument.reference_type !== CONSUMPTION_REFERENCE_TYPE ||
      existingDocument.reference_id !== reservation.inventory_reservation_id)
  ) {
    throwIdempotencyConflict();
  }

  const selectedLines = resolveSelectedConsumptionLines(reservation, input);

  if (existingDocument) {
    if (
      !matchesExistingConsumption(
        existingDocument,
        reservation,
        selectedLines,
        input,
      )
    ) {
      throwIdempotencyConflict();
    }

    return {
      inventoryReservationId: reservation.inventory_reservation_id,

      inventoryDocumentId: existingDocument.inventory_document_id,

      reservationStatus: reservation.status,

      outcome: "ALREADY_CONSUMED",
    };
  }

  if (
    reservation.status !== InventoryReservationStatus.ACTIVE &&
    reservation.status !== InventoryReservationStatus.PARTIALLY_CONSUMED
  ) {
    throw new InventoryReservationConsumptionError(
      "INVALID_RESERVATION_STATUS",
      `La reserva con estado ${reservation.status} no puede consumirse.`,
      {
        status:
          "Solo las reservas activas o parcialmente consumidas pueden consumirse.",
      },
    );
  }

  const consumptionTimestamp = new Date();

  if (
    reservation.expires_at &&
    reservation.expires_at.getTime() <= consumptionTimestamp.getTime()
  ) {
    throw new InventoryReservationConsumptionError(
      "RESERVATION_EXPIRED",
      "La reserva ya alcanzó su fecha de vencimiento.",
      {
        expires_at:
          "Libere o expire la reserva antes de registrar nuevas operaciones.",
      },
    );
  }

  for (const line of reservation.lines) {
    validateReservationLineAccounting(line);
  }

  validateSelectedConsumptionQuantities(selectedLines);

  const sourceLocationId = selectedLines[0].line.inventory_location_id;

  const document = await transaction.inventoryDocument.create({
    data: {
      document_number: documentNumber,

      document_type: InventoryDocumentType.ISSUE,

      status: InventoryDocumentStatus.DRAFT,

      source_location_id: sourceLocationId,

      destination_location_id: null,

      document_date: consumptionTimestamp,

      reference_type: CONSUMPTION_REFERENCE_TYPE,

      reference_id: reservation.inventory_reservation_id,

      reference_number:
        reservation.reference_number ?? reservation.reservation_number,

      idempotency_key: input.idempotencyKey,

      total_cost: toDecimal(0),

      notes: input.consumptionReason,

      created_by: input.consumedBy,
    },
  });

  const orderedSelectedLines = [...selectedLines].sort((left, right) => {
    const leftKey = [
      left.line.inventory_product_variant_id,
      left.line.inventory_location_id,
      left.line.inventory_reservation_line_id,
    ].join(":");

    const rightKey = [
      right.line.inventory_product_variant_id,
      right.line.inventory_location_id,
      right.line.inventory_reservation_line_id,
    ].join(":");

    return leftKey.localeCompare(rightKey);
  });

  let documentTotal = toDecimal(0);

  let consumedQuantityTotal = toDecimal(0);

  const consumedQuantityByLineId = new Map<string, Prisma.Decimal>();

  for (const [index, selectedLine] of orderedSelectedLines.entries()) {
    const lineResult = await consumeSelectedLine(
      transaction,
      reservation,
      document.inventory_document_id,
      selectedLine,
      index + 1,
      consumptionTimestamp,
      input,
    );

    documentTotal = documentTotal.plus(lineResult.lineTotal);

    consumedQuantityTotal = consumedQuantityTotal.plus(lineResult.quantity);

    consumedQuantityByLineId.set(
      selectedLine.line.inventory_reservation_line_id,

      lineResult.quantity,
    );
  }

  const remainingReservedQuantity = reservation.lines.reduce((total, line) => {
    const consumedNow =
      consumedQuantityByLineId.get(line.inventory_reservation_line_id) ??
      toDecimal(0);

    return total.plus(toDecimal(line.quantity_reserved).minus(consumedNow));
  }, toDecimal(0));

  const newReservationStatus = remainingReservedQuantity.isZero()
    ? InventoryReservationStatus.CONSUMED
    : InventoryReservationStatus.PARTIALLY_CONSUMED;

  const documentUpdate = await transaction.inventoryDocument.updateMany({
    where: {
      inventory_document_id: document.inventory_document_id,

      status: InventoryDocumentStatus.DRAFT,
    },

    data: {
      status: InventoryDocumentStatus.POSTED,

      total_cost: roundMoney(documentTotal),

      posted_by: input.consumedBy,

      posted_at: consumptionTimestamp,
    },
  });

  if (documentUpdate.count !== 1) {
    throw new InventoryReservationConsumptionError(
      "TRANSACTION_CONFLICT",
      "El documento cambió durante el consumo.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const reservationUpdate = await transaction.inventoryReservation.updateMany({
    where: {
      inventory_reservation_id: reservation.inventory_reservation_id,

      status: reservation.status,
    },

    data: {
      status: newReservationStatus,

      consumed_at: consumptionTimestamp,
    },
  });

  if (reservationUpdate.count !== 1) {
    throw new InventoryReservationConsumptionError(
      "TRANSACTION_CONFLICT",
      "La reserva cambió durante el consumo.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,

      event_type: InventoryReservationEventType.CONSUMED,

      previous_status: reservation.status,

      new_status: newReservationStatus,

      quantity: consumedQuantityTotal,

      reference_type: reservation.reference_type,

      reference_id: reservation.reference_id,

      reference_number: reservation.reference_number,

      reason: input.consumptionReason,

      metadata: {
        idempotency_key: input.idempotencyKey,

        inventory_document_id: document.inventory_document_id,

        source_location_id: sourceLocationId,

        line_count: orderedSelectedLines.length,

        quantity_consumed_total: consumedQuantityTotal.toString(),

        total_cost: roundMoney(documentTotal).toString(),

        remaining_reserved_quantity: remainingReservedQuantity.toString(),
      },

      created_by: input.consumedBy,
    },
  });

  return {
    inventoryReservationId: reservation.inventory_reservation_id,

    inventoryDocumentId: document.inventory_document_id,

    reservationStatus: newReservationStatus,

    outcome: "CONSUMED",
  };
}

function isRetryableTransactionError(error: unknown) {
  if (
    error instanceof InventoryReservationConsumptionError &&
    error.code === "TRANSACTION_CONFLICT"
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2034" || error.code === "P2002";
  }

  return false;
}

export async function consumeInventoryReservationRecord(
  inventoryReservationId: string,
  input: InventoryReservationConsumptionInput,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      const documentNumber = generateInventoryDocumentNumber(
        InventoryDocumentType.ISSUE,
      );

      return await prisma.$transaction(
        (transaction) =>
          executeConsumptionTransaction(
            transaction,
            inventoryReservationId,
            input,
            documentNumber,
          ),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      lastError = error;

      if (
        !isRetryableTransactionError(error) ||
        attempt === MAX_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw (
    lastError ?? new Error("No fue posible consumir la reserva de inventario.")
  );
}
