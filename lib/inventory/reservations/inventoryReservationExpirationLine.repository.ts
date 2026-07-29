import { InventoryReservationEventType, Prisma } from "@prisma/client";

import {
  InventoryReservationExpirationError,
  type InventoryReservationExpirationInput,
} from "./inventoryReservationExpiration.types";

export const expirationReservationInclude = {
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

export type ExpirationReservation = Prisma.InventoryReservationGetPayload<{
  include: typeof expirationReservationInclude;
}>;

export type ExpirationReservationLine = ExpirationReservation["lines"][number];

export type ExpirationTransaction = Prisma.TransactionClient;

type ExpirationStockBalance = {
  inventory_stock_balance_id: string;
  quantity_on_hand: Prisma.Decimal;
  quantity_reserved: Prisma.Decimal;
  version: number;
};

export function toExpirationDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

function getLineLabel(line: ExpirationReservationLine) {
  return line.variant.name ?? line.variant.product.name;
}

export function validateExpirationLineAccounting(
  line: ExpirationReservationLine,
) {
  const requestedQuantity = toExpirationDecimal(line.quantity_requested);

  const reservedQuantity = toExpirationDecimal(line.quantity_reserved);

  const consumedQuantity = toExpirationDecimal(line.quantity_consumed);

  const releasedQuantity = toExpirationDecimal(line.quantity_released);

  if (
    requestedQuantity.lte(0) ||
    reservedQuantity.lt(0) ||
    consumedQuantity.lt(0) ||
    releasedQuantity.lt(0)
  ) {
    throw new InventoryReservationExpirationError(
      "INVALID_LINE_STATE",
      `La línea de ${getLineLabel(line)} contiene cantidades inválidas.`,
      {
        reservation: "Las cantidades de la reserva no pueden ser negativas.",
      },
    );
  }

  const accountedQuantity = reservedQuantity
    .plus(consumedQuantity)
    .plus(releasedQuantity);

  if (!requestedQuantity.eq(accountedQuantity)) {
    throw new InventoryReservationExpirationError(
      "INVALID_LINE_STATE",
      `La línea de ${getLineLabel(line)} no mantiene su balance de cantidades.`,
      {
        reservation:
          "La cantidad solicitada debe coincidir con la suma reservada, consumida y liberada.",
      },
    );
  }
}

async function findExpirationStockBalance(
  transaction: ExpirationTransaction,
  line: ExpirationReservationLine,
): Promise<ExpirationStockBalance | null> {
  return transaction.inventoryStockBalance.findUnique({
    where: {
      inventory_product_variant_id_inventory_location_id: {
        inventory_product_variant_id: line.inventory_product_variant_id,

        inventory_location_id: line.inventory_location_id,
      },
    },

    select: {
      inventory_stock_balance_id: true,

      quantity_on_hand: true,

      quantity_reserved: true,

      version: true,
    },
  });
}

export async function expireInventoryReservationLine(
  transaction: ExpirationTransaction,
  reservation: ExpirationReservation,
  line: ExpirationReservationLine,
  expirationTimestamp: Date,
  input: InventoryReservationExpirationInput,
) {
  const reservedQuantity = toExpirationDecimal(line.quantity_reserved);

  if (reservedQuantity.isZero()) {
    return toExpirationDecimal(0);
  }

  const currentBalance = await findExpirationStockBalance(transaction, line);

  if (!currentBalance) {
    throw new InventoryReservationExpirationError(
      "STOCK_BALANCE_NOT_FOUND",
      `No existe un balance de inventario para ${getLineLabel(line)}.`,
      {
        reservation: "No se encontró el balance asociado con la reserva.",
      },
    );
  }

  const balanceReservedBefore = toExpirationDecimal(
    currentBalance.quantity_reserved,
  );

  if (balanceReservedBefore.lt(reservedQuantity)) {
    throw new InventoryReservationExpirationError(
      "STOCK_BALANCE_MISMATCH",
      `El balance de ${getLineLabel(line)} no contiene la cantidad reservada esperada.`,
      {
        reservation:
          `Reservado en la línea: ${reservedQuantity.toString()}. ` +
          `Reservado en el balance: ${balanceReservedBefore.toString()}.`,
      },
    );
  }

  const balanceUpdate = await transaction.inventoryStockBalance.updateMany({
    where: {
      inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,

      version: currentBalance.version,

      quantity_reserved: {
        gte: reservedQuantity,
      },
    },

    data: {
      quantity_reserved: {
        decrement: reservedQuantity,
      },

      version: {
        increment: 1,
      },
    },
  });

  if (balanceUpdate.count !== 1) {
    throw new InventoryReservationExpirationError(
      "TRANSACTION_CONFLICT",
      "Las existencias cambiaron durante el vencimiento.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const lineUpdate = await transaction.inventoryReservationLine.updateMany({
    where: {
      inventory_reservation_line_id: line.inventory_reservation_line_id,

      inventory_reservation_id: reservation.inventory_reservation_id,

      quantity_reserved: line.quantity_reserved,

      quantity_consumed: line.quantity_consumed,

      quantity_released: line.quantity_released,
    },

    data: {
      quantity_reserved: {
        decrement: reservedQuantity,
      },

      quantity_released: {
        increment: reservedQuantity,
      },
    },
  });

  if (lineUpdate.count !== 1) {
    throw new InventoryReservationExpirationError(
      "TRANSACTION_CONFLICT",
      "La línea de reserva cambió durante el vencimiento.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,

      inventory_reservation_line_id: line.inventory_reservation_line_id,

      event_type: InventoryReservationEventType.EXPIRED,

      previous_status: null,

      new_status: null,

      quantity: reservedQuantity,

      reference_type: reservation.reference_type,

      reference_id: reservation.reference_id,

      reference_number: reservation.reference_number,

      reason: input.expirationReason,

      metadata: {
        inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,

        expiration_timestamp: expirationTimestamp.toISOString(),

        quantity_on_hand: currentBalance.quantity_on_hand.toString(),

        quantity_reserved_before: balanceReservedBefore.toString(),

        quantity_reserved_after: balanceReservedBefore
          .minus(reservedQuantity)
          .toString(),

        reservation_quantity_reserved_before: reservedQuantity.toString(),

        reservation_quantity_reserved_after: "0",
      },

      created_by: input.expiredBy,
    },
  });

  return reservedQuantity;
}
