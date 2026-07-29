import {
  InventoryReservationEventType,
  InventoryReservationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  InventoryReservationReleaseError,
  type InventoryReservationReleaseInput,
  type InventoryReservationReleaseTransactionResult,
} from "./inventoryReservationRelease.types";

const MAX_TRANSACTION_ATTEMPTS = 3;

const releaseReservationInclude = {
  lines: {
    include: {
      variant: {
        include: {
          product: true,
        },
      },
      location: true,
    },
    orderBy: {
      line_number: "asc",
    },
  },
} satisfies Prisma.InventoryReservationInclude;

type ReleaseReservation = Prisma.InventoryReservationGetPayload<{
  include: typeof releaseReservationInclude;
}>;

type ReleaseLine = ReleaseReservation["lines"][number];

type ReleaseTransaction = Prisma.TransactionClient;

type CurrentBalance = {
  inventory_stock_balance_id: string;
  quantity_on_hand: Prisma.Decimal;
  quantity_reserved: Prisma.Decimal;
  version: number;
};

function toDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

function buildLineField(line: ReleaseLine, field: string) {
  return `lines.${line.line_number - 1}.${field}`;
}

function getLineLabel(line: ReleaseLine) {
  return line.variant.name ?? line.variant.product.name;
}

function validateLineAccounting(line: ReleaseLine) {
  const requestedQuantity = toDecimal(line.quantity_requested);

  const reservedQuantity = toDecimal(line.quantity_reserved);

  const consumedQuantity = toDecimal(line.quantity_consumed);

  const releasedQuantity = toDecimal(line.quantity_released);

  if (
    requestedQuantity.lte(0) ||
    reservedQuantity.lt(0) ||
    consumedQuantity.lt(0) ||
    releasedQuantity.lt(0)
  ) {
    throw new InventoryReservationReleaseError(
      "INVALID_LINE_STATE",
      `La lÃ­nea de ${getLineLabel(line)} contiene cantidades invÃ¡lidas.`,
      {
        [buildLineField(line, "quantity_reserved")]:
          "Las cantidades de la lÃ­nea no pueden ser negativas.",
      },
    );
  }

  const accountedQuantity = reservedQuantity
    .plus(consumedQuantity)
    .plus(releasedQuantity);

  if (!requestedQuantity.eq(accountedQuantity)) {
    throw new InventoryReservationReleaseError(
      "INVALID_LINE_STATE",
      `La lÃ­nea de ${getLineLabel(line)} no mantiene su balance de cantidades.`,
      {
        [buildLineField(line, "quantity_reserved")]:
          "La cantidad solicitada debe coincidir con la suma reservada, consumida y liberada.",
      },
    );
  }
}

async function findCurrentBalance(
  transaction: ReleaseTransaction,
  line: ReleaseLine,
): Promise<CurrentBalance | null> {
  return transaction.inventoryStockBalance.findFirst({
    where: {
      inventory_product_variant_id: line.inventory_product_variant_id,
      inventory_location_id: line.inventory_location_id,
    },
    select: {
      inventory_stock_balance_id: true,
      quantity_on_hand: true,
      quantity_reserved: true,
      version: true,
    },
  });
}

async function releaseReservationLine(
  transaction: ReleaseTransaction,
  reservation: ReleaseReservation,
  line: ReleaseLine,
  input: InventoryReservationReleaseInput,
) {
  const releaseQuantity = toDecimal(line.quantity_reserved);

  if (releaseQuantity.isZero()) {
    return toDecimal(0);
  }

  const currentBalance = await findCurrentBalance(transaction, line);

  if (!currentBalance) {
    throw new InventoryReservationReleaseError(
      "BALANCE_NOT_FOUND",
      `No existe un balance de inventario para ${getLineLabel(line)}.`,
      {
        [buildLineField(line, "inventory_location_id")]:
          "No se encontrÃ³ el balance asociado a la reserva.",
      },
    );
  }

  const balanceReservedBefore = toDecimal(currentBalance.quantity_reserved);

  if (balanceReservedBefore.lt(releaseQuantity)) {
    throw new InventoryReservationReleaseError(
      "RESERVED_BALANCE_MISMATCH",
      `El balance reservado de ${getLineLabel(line)} no coincide con la reserva.`,
      {
        [buildLineField(line, "quantity_reserved")]:
          `Balance reservado: ${balanceReservedBefore.toString()}. ` +
          `Cantidad por liberar: ${releaseQuantity.toString()}.`,
      },
    );
  }

  const balanceUpdate = await transaction.inventoryStockBalance.updateMany({
    where: {
      inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,
      version: currentBalance.version,
      quantity_reserved: {
        gte: releaseQuantity,
      },
    },
    data: {
      quantity_reserved: {
        decrement: releaseQuantity,
      },
      version: {
        increment: 1,
      },
    },
  });

  if (balanceUpdate.count !== 1) {
    throw new InventoryReservationReleaseError(
      "TRANSACTION_CONFLICT",
      "Las existencias cambiaron durante la liberaciÃ³n.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const lineUpdate = await transaction.inventoryReservationLine.updateMany({
    where: {
      inventory_reservation_line_id: line.inventory_reservation_line_id,
      quantity_reserved: line.quantity_reserved,
      quantity_consumed: line.quantity_consumed,
      quantity_released: line.quantity_released,
    },
    data: {
      quantity_reserved: toDecimal(0),
      quantity_released: {
        increment: releaseQuantity,
      },
    },
  });

  if (lineUpdate.count !== 1) {
    throw new InventoryReservationReleaseError(
      "TRANSACTION_CONFLICT",
      "La lÃ­nea cambiÃ³ durante la liberaciÃ³n.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const balanceReservedAfter = balanceReservedBefore.minus(releaseQuantity);

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,
      inventory_reservation_line_id: line.inventory_reservation_line_id,
      event_type: InventoryReservationEventType.RELEASED,
      previous_status: null,
      new_status: null,
      quantity: releaseQuantity,
      reference_type: reservation.reference_type,
      reference_id: reservation.reference_id,
      reference_number: reservation.reference_number,
      reason: input.releaseReason,
      metadata: {
        inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,
        quantity_on_hand: currentBalance.quantity_on_hand.toString(),
        quantity_reserved_before: balanceReservedBefore.toString(),
        quantity_reserved_after: balanceReservedAfter.toString(),
      },
      created_by: input.releasedBy,
    },
  });

  return releaseQuantity;
}

async function executeReleaseTransaction(
  transaction: ReleaseTransaction,
  inventoryReservationId: string,
  input: InventoryReservationReleaseInput,
): Promise<InventoryReservationReleaseTransactionResult> {
  const reservation = await transaction.inventoryReservation.findUnique({
    where: {
      inventory_reservation_id: inventoryReservationId,
    },
    include: releaseReservationInclude,
  });

  if (!reservation) {
    throw new InventoryReservationReleaseError(
      "RESERVATION_NOT_FOUND",
      "La reserva de inventario no existe.",
      {
        inventory_reservation_id: "No se encontrÃ³ la reserva solicitada.",
      },
    );
  }

  if (reservation.status === InventoryReservationStatus.RELEASED) {
    return {
      inventoryReservationId: reservation.inventory_reservation_id,
      outcome: "ALREADY_RELEASED",
    };
  }

  const releasableStatuses: InventoryReservationStatus[] = [
    InventoryReservationStatus.ACTIVE,
    InventoryReservationStatus.PARTIALLY_CONSUMED,
  ];

  if (!releasableStatuses.includes(reservation.status)) {
    throw new InventoryReservationReleaseError(
      "INVALID_RESERVATION_STATUS",
      `La reserva con estado ${reservation.status} no puede liberarse.`,
      {
        status:
          "Solo las reservas activas o parcialmente consumidas pueden liberarse.",
      },
    );
  }

  if (reservation.lines.length === 0) {
    throw new InventoryReservationReleaseError(
      "EMPTY_RESERVATION",
      "La reserva debe contener al menos una lÃ­nea.",
      {
        lines: "La reserva no contiene lÃ­neas para liberar.",
      },
    );
  }

  for (const line of reservation.lines) {
    validateLineAccounting(line);
  }

  const totalReservedQuantity = reservation.lines.reduce(
    (total, line) => total.plus(line.quantity_reserved),
    toDecimal(0),
  );

  if (totalReservedQuantity.lte(0)) {
    throw new InventoryReservationReleaseError(
      "NO_RESERVED_QUANTITY",
      "La reserva no contiene existencias pendientes de liberar.",
      {
        quantity_reserved:
          "No existe una cantidad reservada disponible para liberaciÃ³n.",
      },
    );
  }

  const releaseTimestamp = new Date();

  const reservationUpdate = await transaction.inventoryReservation.updateMany({
    where: {
      inventory_reservation_id: reservation.inventory_reservation_id,
      status: {
        in: releasableStatuses,
      },
    },
    data: {
      status: InventoryReservationStatus.RELEASED,
      released_by: input.releasedBy,
      released_at: releaseTimestamp,
    },
  });

  if (reservationUpdate.count !== 1) {
    throw new InventoryReservationReleaseError(
      "TRANSACTION_CONFLICT",
      "La reserva cambiÃ³ durante la liberaciÃ³n.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const orderedLines = [...reservation.lines].sort((left, right) => {
    const leftKey =
      `${left.inventory_product_variant_id}:` + `${left.inventory_location_id}`;

    const rightKey =
      `${right.inventory_product_variant_id}:` +
      `${right.inventory_location_id}`;

    return leftKey.localeCompare(rightKey);
  });

  let releasedQuantityTotal = toDecimal(0);

  for (const line of orderedLines) {
    const releasedQuantity = await releaseReservationLine(
      transaction,
      reservation,
      line,
      input,
    );

    releasedQuantityTotal = releasedQuantityTotal.plus(releasedQuantity);
  }

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,
      event_type: InventoryReservationEventType.RELEASED,
      previous_status: reservation.status,
      new_status: InventoryReservationStatus.RELEASED,
      quantity: releasedQuantityTotal,
      reference_type: reservation.reference_type,
      reference_id: reservation.reference_id,
      reference_number: reservation.reference_number,
      reason: input.releaseReason,
      metadata: {
        line_count: reservation.lines.length,
        released_line_count: reservation.lines.filter((line) =>
          toDecimal(line.quantity_reserved).gt(0),
        ).length,
        quantity_released_total: releasedQuantityTotal.toString(),
      },
      created_by: input.releasedBy,
    },
  });

  return {
    inventoryReservationId: reservation.inventory_reservation_id,
    outcome: "RELEASED",
  };
}

function isRetryableTransactionError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    return true;
  }

  return (
    error instanceof InventoryReservationReleaseError &&
    error.code === "TRANSACTION_CONFLICT"
  );
}

export async function releaseInventoryReservationRecord(
  inventoryReservationId: string,
  input: InventoryReservationReleaseInput,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executeReleaseTransaction(transaction, inventoryReservationId, input),
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
    lastError ?? new Error("No fue posible liberar la reserva de inventario.")
  );
}
