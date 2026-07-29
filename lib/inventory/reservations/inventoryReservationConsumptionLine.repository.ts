import {
  InventoryDocumentStatus,
  InventoryDocumentType,
  InventoryMovementType,
  InventoryReservationEventType,
  Prisma,
} from "@prisma/client";

import {
  InventoryReservationConsumptionError,
  type InventoryReservationConsumptionInput,
} from "./inventoryReservationConsumption.types";

export const CONSUMPTION_REFERENCE_TYPE = "INVENTORY_RESERVATION_CONSUMPTION";

const MONEY_DECIMAL_PLACES = 4;

export const consumptionReservationInclude = {
  lines: {
    include: {
      variant: {
        include: {
          product: true,
          stock_unit: true,
        },
      },

      location: true,
    },

    orderBy: {
      line_number: "asc",
    },
  },
} satisfies Prisma.InventoryReservationInclude;

export type ConsumptionReservation = Prisma.InventoryReservationGetPayload<{
  include: typeof consumptionReservationInclude;
}>;

export type ConsumptionReservationLine =
  ConsumptionReservation["lines"][number];

export type ConsumptionTransaction = Prisma.TransactionClient;

export type SelectedConsumptionLine = {
  inputIndex: number;
  line: ConsumptionReservationLine;
  quantity: Prisma.Decimal;
};

type ConsumptionStockBalance = {
  inventory_stock_balance_id: string;
  quantity_on_hand: Prisma.Decimal;
  quantity_reserved: Prisma.Decimal;
  average_unit_cost: Prisma.Decimal;
  version: number;
};

export function toDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

export function roundMoney(value: Prisma.Decimal | string | number) {
  return toDecimal(value).toDecimalPlaces(
    MONEY_DECIMAL_PLACES,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}

function buildPostingKey(
  inventoryDocumentId: string,
  inventoryReservationLineId: string,
) {
  return [
    "RESERVATION",
    "CONSUMPTION",
    inventoryDocumentId,
    inventoryReservationLineId,
  ].join(":");
}

function buildLineField(inputIndex: number, field: string) {
  return `lines.${inputIndex}.${field}`;
}

function getLineLabel(line: ConsumptionReservationLine) {
  return line.variant.name ?? line.variant.product.name;
}

export function validateReservationLineAccounting(
  line: ConsumptionReservationLine,
) {
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
    throw new InventoryReservationConsumptionError(
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
    throw new InventoryReservationConsumptionError(
      "INVALID_LINE_STATE",
      `La línea de ${getLineLabel(line)} no mantiene su balance de cantidades.`,
      {
        reservation:
          "La cantidad solicitada debe coincidir con la suma reservada, consumida y liberada.",
      },
    );
  }

  if (releasedQuantity.gt(0)) {
    throw new InventoryReservationConsumptionError(
      "INVALID_LINE_STATE",
      `La línea de ${getLineLabel(line)} contiene una cantidad liberada.`,
      {
        reservation:
          "Una reserva liberada no puede registrar consumos adicionales.",
      },
    );
  }
}

function validateQuantityForStockUnit(selectedLine: SelectedConsumptionLine) {
  const stockUnit = selectedLine.line.variant.stock_unit;

  if (!stockUnit.allows_decimal && !selectedLine.quantity.isInteger()) {
    throw new InventoryReservationConsumptionError(
      "INVALID_UNIT_QUANTITY",
      `La unidad ${stockUnit.code} no permite cantidades decimales.`,
      {
        [buildLineField(selectedLine.inputIndex, "quantity")]:
          `La unidad ${stockUnit.code} solo permite cantidades enteras.`,
      },
    );
  }

  if (selectedLine.quantity.decimalPlaces() > stockUnit.decimal_scale) {
    throw new InventoryReservationConsumptionError(
      "INVALID_UNIT_QUANTITY",
      `La cantidad supera la precisión permitida para ${stockUnit.code}.`,
      {
        [buildLineField(selectedLine.inputIndex, "quantity")]:
          `La unidad ${stockUnit.code} permite hasta ${stockUnit.decimal_scale} decimales.`,
      },
    );
  }
}

export function resolveSelectedConsumptionLines(
  reservation: ConsumptionReservation,
  input: InventoryReservationConsumptionInput,
) {
  const reservationLinesById = new Map(
    reservation.lines.map((line) => [line.inventory_reservation_line_id, line]),
  );

  const selectedLines = input.lines.map(
    (inputLine, inputIndex): SelectedConsumptionLine => {
      const line = reservationLinesById.get(
        inputLine.inventoryReservationLineId,
      );

      if (!line) {
        throw new InventoryReservationConsumptionError(
          "RESERVATION_LINE_NOT_FOUND",
          "Una de las líneas no pertenece a la reserva.",
          {
            [buildLineField(inputIndex, "inventory_reservation_line_id")]:
              "No se encontró esta línea dentro de la reserva.",
          },
        );
      }

      const selectedLine = {
        inputIndex,

        line,

        quantity: toDecimal(inputLine.quantity),
      };

      validateQuantityForStockUnit(selectedLine);

      return selectedLine;
    },
  );

  const sourceLocationIds = new Set(
    selectedLines.map(
      (selectedLine) => selectedLine.line.inventory_location_id,
    ),
  );

  if (sourceLocationIds.size !== 1) {
    throw new InventoryReservationConsumptionError(
      "MULTIPLE_SOURCE_LOCATIONS",
      "Un consumo solo puede procesar materiales de una ubicación.",
      {
        lines: "Separe el consumo en una solicitud por ubicación.",
      },
    );
  }

  return selectedLines;
}

export function validateSelectedConsumptionQuantities(
  selectedLines: SelectedConsumptionLine[],
) {
  for (const selectedLine of selectedLines) {
    const reservedQuantity = toDecimal(selectedLine.line.quantity_reserved);

    if (selectedLine.quantity.gt(reservedQuantity)) {
      throw new InventoryReservationConsumptionError(
        "QUANTITY_EXCEEDS_RESERVED",
        `La cantidad solicitada supera lo reservado para ${getLineLabel(selectedLine.line)}.`,
        {
          [buildLineField(selectedLine.inputIndex, "quantity")]:
            `Reservado: ${reservedQuantity.toString()}. ` +
            `Solicitado: ${selectedLine.quantity.toString()}.`,
        },
      );
    }
  }
}

async function findCurrentBalance(
  transaction: ConsumptionTransaction,
  line: ConsumptionReservationLine,
): Promise<ConsumptionStockBalance | null> {
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

      average_unit_cost: true,

      version: true,
    },
  });
}

export async function findExistingConsumptionDocument(
  transaction: ConsumptionTransaction,
  idempotencyKey: string,
) {
  return transaction.inventoryDocument.findUnique({
    where: {
      idempotency_key: idempotencyKey,
    },

    include: {
      lines: true,

      movements: true,
    },
  });
}

type ExistingConsumptionDocument = NonNullable<
  Awaited<ReturnType<typeof findExistingConsumptionDocument>>
>;

export function matchesExistingConsumption(
  document: ExistingConsumptionDocument,
  reservation: ConsumptionReservation,
  selectedLines: SelectedConsumptionLine[],
  input: InventoryReservationConsumptionInput,
) {
  if (
    document.document_type !== InventoryDocumentType.ISSUE ||
    document.status !== InventoryDocumentStatus.POSTED ||
    document.reference_type !== CONSUMPTION_REFERENCE_TYPE ||
    document.reference_id !== reservation.inventory_reservation_id ||
    document.source_location_id !==
      selectedLines[0].line.inventory_location_id ||
    document.notes !== input.consumptionReason ||
    document.posted_by !== input.consumedBy ||
    document.lines.length !== selectedLines.length ||
    document.movements.length !== selectedLines.length
  ) {
    return false;
  }

  const movementsByPostingKey = new Map(
    document.movements.map((movement) => [movement.posting_key, movement]),
  );

  for (const selectedLine of selectedLines) {
    const expectedPostingKey = buildPostingKey(
      document.inventory_document_id,

      selectedLine.line.inventory_reservation_line_id,
    );

    const movement = movementsByPostingKey.get(expectedPostingKey);

    if (
      !movement ||
      movement.movement_type !== InventoryMovementType.OUTBOUND ||
      movement.inventory_product_variant_id !==
        selectedLine.line.inventory_product_variant_id ||
      movement.inventory_location_id !==
        selectedLine.line.inventory_location_id ||
      !toDecimal(movement.quantity_delta).eq(selectedLine.quantity.negated())
    ) {
      return false;
    }
  }

  return true;
}

export async function consumeSelectedLine(
  transaction: ConsumptionTransaction,
  reservation: ConsumptionReservation,
  inventoryDocumentId: string,
  selectedLine: SelectedConsumptionLine,
  documentLineNumber: number,
  consumptionTimestamp: Date,
  input: InventoryReservationConsumptionInput,
) {
  const line = selectedLine.line;

  const quantity = selectedLine.quantity;

  const currentBalance = await findCurrentBalance(transaction, line);

  if (!currentBalance) {
    throw new InventoryReservationConsumptionError(
      "STOCK_BALANCE_NOT_FOUND",
      `No existe un balance de inventario para ${getLineLabel(line)}.`,
      {
        [buildLineField(selectedLine.inputIndex, "quantity")]:
          "No se encontró el balance asociado con la reserva.",
      },
    );
  }

  const quantityOnHandBefore = toDecimal(currentBalance.quantity_on_hand);

  const quantityReservedBefore = toDecimal(currentBalance.quantity_reserved);

  if (
    quantityOnHandBefore.lt(quantity) ||
    quantityReservedBefore.lt(quantity)
  ) {
    throw new InventoryReservationConsumptionError(
      "STOCK_BALANCE_MISMATCH",
      `El balance de ${getLineLabel(line)} no permite registrar el consumo.`,
      {
        [buildLineField(selectedLine.inputIndex, "quantity")]:
          `Existencia física: ${quantityOnHandBefore.toString()}. ` +
          `Reservado en balance: ${quantityReservedBefore.toString()}. ` +
          `Solicitado: ${quantity.toString()}.`,
      },
    );
  }

  const balanceUpdate = await transaction.inventoryStockBalance.updateMany({
    where: {
      inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,

      version: currentBalance.version,

      quantity_on_hand: {
        gte: quantity,
      },

      quantity_reserved: {
        gte: quantity,
      },
    },

    data: {
      quantity_on_hand: {
        decrement: quantity,
      },

      quantity_reserved: {
        decrement: quantity,
      },

      version: {
        increment: 1,
      },
    },
  });

  if (balanceUpdate.count !== 1) {
    throw new InventoryReservationConsumptionError(
      "TRANSACTION_CONFLICT",
      "Las existencias cambiaron durante el consumo.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const reservationLineUpdate =
    await transaction.inventoryReservationLine.updateMany({
      where: {
        inventory_reservation_line_id: line.inventory_reservation_line_id,

        quantity_reserved: line.quantity_reserved,

        quantity_consumed: line.quantity_consumed,

        quantity_released: line.quantity_released,
      },

      data: {
        quantity_reserved: {
          decrement: quantity,
        },

        quantity_consumed: {
          increment: quantity,
        },
      },
    });

  if (reservationLineUpdate.count !== 1) {
    throw new InventoryReservationConsumptionError(
      "TRANSACTION_CONFLICT",
      "La línea de reserva cambió durante el consumo.",
      {
        reservation: "Actualice la reserva e intente nuevamente.",
      },
    );
  }

  const unitCost = roundMoney(currentBalance.average_unit_cost);

  const lineTotal = roundMoney(quantity.times(unitCost));

  const documentLine = await transaction.inventoryDocumentLine.create({
    data: {
      inventory_document_id: inventoryDocumentId,

      inventory_product_variant_id: line.inventory_product_variant_id,

      inventory_product_code_id: null,

      unit_of_measure_id: line.variant.stock_unit_id,

      line_number: documentLineNumber,

      quantity,

      conversion_factor: toDecimal(1),

      stock_quantity: quantity,

      received_stock_quantity: toDecimal(0),

      unit_cost: unitCost,

      total_cost: lineTotal,

      product_name_snapshot: line.variant.product.name,

      variant_name_snapshot: line.variant.name,

      unit_code_snapshot: line.variant.stock_unit.code,

      code_snapshot: null,

      notes: input.consumptionReason,
    },
  });

  const movement = await transaction.inventoryMovement.create({
    data: {
      inventory_document_id: inventoryDocumentId,

      inventory_document_line_id: documentLine.inventory_document_line_id,

      inventory_product_variant_id: line.inventory_product_variant_id,

      inventory_location_id: line.inventory_location_id,

      posting_key: buildPostingKey(
        inventoryDocumentId,

        line.inventory_reservation_line_id,
      ),

      movement_type: InventoryMovementType.OUTBOUND,

      quantity_delta: quantity.negated(),

      unit_cost: unitCost,

      total_cost_delta: lineTotal.negated(),

      movement_at: consumptionTimestamp,

      notes: input.consumptionReason,

      created_by: input.consumedBy,
    },
  });

  await transaction.inventoryReservationEvent.create({
    data: {
      inventory_reservation_id: reservation.inventory_reservation_id,

      inventory_reservation_line_id: line.inventory_reservation_line_id,

      event_type: InventoryReservationEventType.CONSUMED,

      previous_status: null,

      new_status: null,

      quantity,

      reference_type: reservation.reference_type,

      reference_id: reservation.reference_id,

      reference_number: reservation.reference_number,

      reason: input.consumptionReason,

      metadata: {
        idempotency_key: input.idempotencyKey,

        inventory_document_id: inventoryDocumentId,

        inventory_document_line_id: documentLine.inventory_document_line_id,

        inventory_movement_id: movement.inventory_movement_id,

        inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,

        quantity_on_hand_before: quantityOnHandBefore.toString(),

        quantity_on_hand_after: quantityOnHandBefore.minus(quantity).toString(),

        quantity_reserved_before: quantityReservedBefore.toString(),

        quantity_reserved_after: quantityReservedBefore
          .minus(quantity)
          .toString(),

        unit_cost: unitCost.toString(),

        total_cost: lineTotal.toString(),
      },

      created_by: input.consumedBy,
    },
  });

  return {
    quantity,
    lineTotal,
  };
}
