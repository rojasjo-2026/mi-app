import {
  InventoryReservationEventType,
  InventoryReservationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  InventoryReservationActivationError,
  type InventoryReservationActivationTransactionResult,
} from "./inventoryReservationActivation.types";

const MAX_TRANSACTION_ATTEMPTS = 3;

const activationReservationInclude = {
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

type ActivationReservation = Prisma.InventoryReservationGetPayload<{
  include: typeof activationReservationInclude;
}>;

type ActivationLine = ActivationReservation["lines"][number];

type ActivationTransaction = Prisma.TransactionClient;

type CurrentBalance = {
  inventory_stock_balance_id: string;
  quantity_on_hand: Prisma.Decimal;
  quantity_reserved: Prisma.Decimal;
  version: number;
};

function toDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

function buildLineField(line: ActivationLine, field: string) {
  return `lines.${line.line_number - 1}.${field}`;
}

function getLineLabel(line: ActivationLine) {
  return line.variant.name ?? line.variant.product.name;
}

function validateReservationLine(line: ActivationLine) {
  const variantField = buildLineField(line, "inventory_product_variant_id");

  const locationField = buildLineField(line, "inventory_location_id");

  const quantityField = buildLineField(line, "quantity_requested");

  if (!line.variant.is_active) {
    throw new InventoryReservationActivationError(
      "VARIANT_INACTIVE",
      `La variante de ${getLineLabel(line)} está inactiva.`,
      {
        [variantField]: "La variante indicada está inactiva.",
      },
    );
  }

  if (!line.variant.product.is_active) {
    throw new InventoryReservationActivationError(
      "PRODUCT_INACTIVE",
      `El producto ${line.variant.product.name} está inactivo.`,
      {
        [variantField]: "El producto asociado está inactivo.",
      },
    );
  }

  if (!line.variant.product.manages_stock) {
    throw new InventoryReservationActivationError(
      "PRODUCT_STOCK_DISABLED",
      `El producto ${line.variant.product.name} no administra existencias.`,
      {
        [variantField]: "El producto asociado no administra existencias.",
      },
    );
  }

  if (!line.location.is_active) {
    throw new InventoryReservationActivationError(
      "LOCATION_INACTIVE",
      `La ubicación ${line.location.name} está inactiva.`,
      {
        [locationField]: "La ubicación indicada está inactiva.",
      },
    );
  }

  if (!line.location.allows_stock) {
    throw new InventoryReservationActivationError(
      "LOCATION_STOCK_DISABLED",
      `La ubicación ${line.location.name} no permite existencias.`,
      {
        [locationField]: "La ubicación indicada no permite existencias.",
      },
    );
  }

  const requestedQuantity = toDecimal(line.quantity_requested);

  if (requestedQuantity.lte(0)) {
    throw new InventoryReservationActivationError(
      "INVALID_LINE_QUANTITY",
      `La cantidad solicitada para ${getLineLabel(line)} no es válida.`,
      {
        [quantityField]: "La cantidad solicitada debe ser mayor que cero.",
      },
    );
  }

  if (
    !toDecimal(line.quantity_reserved).isZero() ||
    !toDecimal(line.quantity_consumed).isZero() ||
    !toDecimal(line.quantity_released).isZero()
  ) {
    throw new InventoryReservationActivationError(
      "INVALID_LINE_STATE",
      "La reserva contiene una línea que ya fue procesada.",
      {
        [quantityField]: "La línea no se encuentra disponible para activación.",
      },
    );
  }
}

async function findCurrentBalance(
  transaction: ActivationTransaction,
  line: ActivationLine,
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

async function applyReservationLine(
  transaction: ActivationTransaction,
  reservation: ActivationReservation,
  line: ActivationLine,
) {
  validateReservationLine(line);

  const requestedQuantity = toDecimal(line.quantity_requested);

  const currentBalance = await findCurrentBalance(transaction, line);

  const quantityOnHand = currentBalance
    ? toDecimal(currentBalance.quantity_on_hand)
    : toDecimal(0);

  const quantityReservedBefore = currentBalance
    ? toDecimal(currentBalance.quantity_reserved)
    : toDecimal(0);

  const quantityAvailableBefore = quantityOnHand.minus(quantityReservedBefore);

  if (!currentBalance || quantityAvailableBefore.lt(requestedQuantity)) {
    throw new InventoryReservationActivationError(
      "INSUFFICIENT_STOCK",
      `No hay existencias suficientes para ${getLineLabel(line)}.`,
      {
        [buildLineField(line, "quantity_requested")]:
          `Disponible: ${quantityAvailableBefore.toString()}. ` +
          `Solicitado: ${requestedQuantity.toString()}.`,
      },
    );
  }

  const balanceUpdate = await transaction.inventoryStockBalance.updateMany({
    where: {
      inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,
      version: currentBalance.version,
    },
    data: {
      quantity_reserved: {
        increment: requestedQuantity,
      },
      version: {
        increment: 1,
      },
    },
  });

  if (balanceUpdate.count !== 1) {
    throw new InventoryReservationActivationError(
      "TRANSACTION_CONFLICT",
      "Las existencias cambiaron durante la activación.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const lineUpdate = await transaction.inventoryReservationLine.updateMany({
    where: {
      inventory_reservation_line_id: line.inventory_reservation_line_id,
      quantity_reserved: toDecimal(0),
      quantity_consumed: toDecimal(0),
      quantity_released: toDecimal(0),
    },
    data: {
      quantity_reserved: requestedQuantity,
    },
  });

  if (lineUpdate.count !== 1) {
    throw new InventoryReservationActivationError(
      "TRANSACTION_CONFLICT",
      "La línea cambió durante la activación.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,
      inventory_reservation_line_id: line.inventory_reservation_line_id,
      event_type: InventoryReservationEventType.ACTIVATED,
      previous_status: null,
      new_status: null,
      quantity: requestedQuantity,
      reference_type: reservation.reference_type,
      reference_id: reservation.reference_id,
      reference_number: reservation.reference_number,
      metadata: {
        inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,
        quantity_on_hand: quantityOnHand.toString(),
        quantity_reserved_before: quantityReservedBefore.toString(),
        quantity_available_before: quantityAvailableBefore.toString(),
      },
      created_by: null,
    },
  });
}

async function executeActivationTransaction(
  transaction: ActivationTransaction,
  inventoryReservationId: string,
): Promise<InventoryReservationActivationTransactionResult> {
  const reservation = await transaction.inventoryReservation.findUnique({
    where: {
      inventory_reservation_id: inventoryReservationId,
    },
    include: activationReservationInclude,
  });

  if (!reservation) {
    throw new InventoryReservationActivationError(
      "RESERVATION_NOT_FOUND",
      "La reserva de inventario no existe.",
      {
        inventory_reservation_id: "No se encontró la reserva solicitada.",
      },
    );
  }

  if (reservation.status === InventoryReservationStatus.ACTIVE) {
    return {
      inventoryReservationId: reservation.inventory_reservation_id,
      outcome: "ALREADY_ACTIVE",
    };
  }

  if (reservation.status !== InventoryReservationStatus.DRAFT) {
    throw new InventoryReservationActivationError(
      "INVALID_RESERVATION_STATUS",
      `La reserva con estado ${reservation.status} no puede activarse.`,
      {
        status: "Solo las reservas en borrador pueden activarse.",
      },
    );
  }

  const activationTimestamp = new Date();

  if (
    reservation.expires_at &&
    reservation.expires_at.getTime() <= activationTimestamp.getTime()
  ) {
    throw new InventoryReservationActivationError(
      "RESERVATION_EXPIRED",
      "La reserva alcanzó su fecha de vencimiento.",
      {
        expires_at: "La reserva vencida no puede activarse.",
      },
    );
  }

  if (reservation.lines.length === 0) {
    throw new InventoryReservationActivationError(
      "EMPTY_RESERVATION",
      "La reserva debe contener al menos una línea.",
      {
        lines: "Agregue al menos una línea antes de activar.",
      },
    );
  }

  const reservationUpdate = await transaction.inventoryReservation.updateMany({
    where: {
      inventory_reservation_id: reservation.inventory_reservation_id,
      status: InventoryReservationStatus.DRAFT,
    },
    data: {
      status: InventoryReservationStatus.ACTIVE,
      activated_by: null,
      activated_at: activationTimestamp,
    },
  });

  if (reservationUpdate.count !== 1) {
    throw new InventoryReservationActivationError(
      "TRANSACTION_CONFLICT",
      "La reserva cambió durante la activación.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const orderedLines = [...reservation.lines].sort((left, right) => {
    const leftKey = `${left.inventory_product_variant_id}:${left.inventory_location_id}`;

    const rightKey = `${right.inventory_product_variant_id}:${right.inventory_location_id}`;

    return leftKey.localeCompare(rightKey);
  });

  for (const line of orderedLines) {
    await applyReservationLine(transaction, reservation, line);
  }

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,
      event_type: InventoryReservationEventType.ACTIVATED,
      previous_status: InventoryReservationStatus.DRAFT,
      new_status: InventoryReservationStatus.ACTIVE,
      reference_type: reservation.reference_type,
      reference_id: reservation.reference_id,
      reference_number: reservation.reference_number,
      metadata: {
        line_count: reservation.lines.length,
      },
      created_by: null,
    },
  });

  return {
    inventoryReservationId: reservation.inventory_reservation_id,
    outcome: "ACTIVATED",
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
    error instanceof InventoryReservationActivationError &&
    error.code === "TRANSACTION_CONFLICT"
  );
}

export async function activateInventoryReservationRecord(
  inventoryReservationId: string,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executeActivationTransaction(transaction, inventoryReservationId),
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
    lastError ?? new Error("No fue posible activar la reserva de inventario.")
  );
}
