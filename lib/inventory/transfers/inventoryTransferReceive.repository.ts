import {
  InventoryDocumentStatus,
  InventoryMovementType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  InventoryTransferError,
  type InventoryTransferTransactionResult,
} from "./inventoryTransfer.types";

import {
  validateTransferDocumentType,
  validateTransferLocations,
} from "./inventoryTransfer.validators";

const MAX_TRANSACTION_ATTEMPTS = 3;

const transferReceiveInclude =
  Prisma.validator<Prisma.InventoryDocumentInclude>()({
    source_location: {
      select: {
        inventory_location_id: true,
        location_code: true,
        name: true,
      },
    },

    destination_location: {
      select: {
        inventory_location_id: true,
        location_code: true,
        name: true,
        allows_stock: true,
        is_active: true,
      },
    },

    lines: {
      orderBy: {
        line_number: "asc",
      },
    },
  });

type TransferReceiveDocument = Prisma.InventoryDocumentGetPayload<{
  include: typeof transferReceiveInclude;
}>;

type TransferReceiveLine = TransferReceiveDocument["lines"][number];

type TransferReceiveLocation = NonNullable<
  TransferReceiveDocument["destination_location"]
>;

type TransferTransaction = Prisma.TransactionClient;

type ReceiveLineResult = {
  receivedQuantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  totalCostDelta: Prisma.Decimal;
};

function toDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

function roundMoney(value: Prisma.Decimal) {
  return value.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
}

function buildReceivePostingKey(
  inventoryDocumentId: string,
  inventoryDocumentLineId: string,
) {
  return [
    "TRANSFER",
    "RECEIPT",
    inventoryDocumentId,
    inventoryDocumentLineId,
  ].join(":");
}

function buildLineErrorKey(line: TransferReceiveLine, field: string) {
  return `lines.${line.line_number}.${field}`;
}

function validateDestinationLocation(location: TransferReceiveLocation) {
  if (!location.is_active) {
    throw new InventoryTransferError(
      "DESTINATION_LOCATION_INACTIVE",
      `La ubicación de destino ${location.name} está inactiva.`,
      {
        destination_location_id:
          "Active la ubicación de destino antes de recibir la transferencia.",
      },
    );
  }

  if (!location.allows_stock) {
    throw new InventoryTransferError(
      "DESTINATION_LOCATION_STOCK_DISABLED",
      `La ubicación de destino ${location.name} no permite almacenar inventario.`,
      {
        destination_location_id:
          "Seleccione una ubicación que permita existencias.",
      },
    );
  }
}

function resolveDestinationLocation(document: TransferReceiveDocument) {
  const { destinationLocationId } = validateTransferLocations(
    document.source_location_id,
    document.destination_location_id,
  );

  const destinationLocation = document.destination_location;

  if (
    !destinationLocation ||
    destinationLocation.inventory_location_id !== destinationLocationId
  ) {
    throw new InventoryTransferError(
      "DESTINATION_LOCATION_REQUIRED",
      "No fue posible encontrar la ubicación de destino.",
      {
        destination_location_id: "Seleccione una ubicación de destino válida.",
      },
    );
  }

  validateDestinationLocation(destinationLocation);

  return destinationLocation;
}

function resolvePendingQuantity(line: TransferReceiveLine) {
  const stockQuantity = toDecimal(line.stock_quantity);

  const receivedQuantity = toDecimal(line.received_stock_quantity);

  if (!stockQuantity.isFinite() || stockQuantity.lessThanOrEqualTo(0)) {
    throw new InventoryTransferError(
      "INVALID_LINE_QUANTITY",
      `La línea ${line.line_number} tiene una cantidad inválida.`,
      {
        [buildLineErrorKey(line, "stock_quantity")]:
          "La cantidad despachada debe ser mayor que cero.",
      },
    );
  }

  if (
    !receivedQuantity.isFinite() ||
    receivedQuantity.lessThan(0) ||
    receivedQuantity.greaterThan(stockQuantity)
  ) {
    throw new InventoryTransferError(
      "INVALID_LINE_QUANTITY",
      `La línea ${line.line_number} tiene una cantidad recibida inválida.`,
      {
        [buildLineErrorKey(line, "received_stock_quantity")]:
          "La cantidad recibida debe estar entre cero y la cantidad despachada.",
      },
    );
  }

  return stockQuantity.minus(receivedQuantity);
}

async function findDestinationBalance(
  transaction: TransferTransaction,
  inventoryProductVariantId: string,
  inventoryLocationId: string,
) {
  return transaction.inventoryStockBalance.findUnique({
    where: {
      inventory_product_variant_id_inventory_location_id: {
        inventory_product_variant_id: inventoryProductVariantId,

        inventory_location_id: inventoryLocationId,
      },
    },
  });
}

async function applyReceiveLine(
  transaction: TransferTransaction,
  line: TransferReceiveLine,
  destinationLocationId: string,
): Promise<ReceiveLineResult | null> {
  const pendingQuantity = resolvePendingQuantity(line);

  if (pendingQuantity.equals(0)) {
    return null;
  }

  const balance = await findDestinationBalance(
    transaction,
    line.inventory_product_variant_id,
    destinationLocationId,
  );

  const currentQuantity = balance
    ? toDecimal(balance.quantity_on_hand)
    : toDecimal(0);

  const currentAverageCost = balance
    ? toDecimal(balance.average_unit_cost)
    : toDecimal(0);

  const transferUnitCost = toDecimal(line.unit_cost);

  const newQuantity = currentQuantity.plus(pendingQuantity);

  const newAverageCost = currentQuantity.greaterThan(0)
    ? roundMoney(
        currentQuantity
          .times(currentAverageCost)
          .plus(pendingQuantity.times(transferUnitCost))
          .dividedBy(newQuantity),
      )
    : roundMoney(transferUnitCost);

  if (balance) {
    await transaction.inventoryStockBalance.update({
      where: {
        inventory_stock_balance_id: balance.inventory_stock_balance_id,
      },

      data: {
        quantity_on_hand: newQuantity,

        average_unit_cost: newAverageCost,

        version: {
          increment: 1,
        },
      },
    });
  } else {
    await transaction.inventoryStockBalance.create({
      data: {
        inventory_product_variant_id: line.inventory_product_variant_id,

        inventory_location_id: destinationLocationId,

        quantity_on_hand: newQuantity,
        quantity_reserved: toDecimal(0),

        average_unit_cost: newAverageCost,
      },
    });
  }

  const totalCostDelta = roundMoney(pendingQuantity.times(transferUnitCost));

  return {
    receivedQuantity: pendingQuantity,
    unitCost: transferUnitCost,
    totalCostDelta,
  };
}

async function executeReceiveTransaction(
  transaction: TransferTransaction,
  inventoryDocumentId: string,
): Promise<InventoryTransferTransactionResult> {
  const document = await transaction.inventoryDocument.findUnique({
    where: {
      inventory_document_id: inventoryDocumentId,
    },

    include: transferReceiveInclude,
  });

  if (!document) {
    throw new InventoryTransferError(
      "DOCUMENT_NOT_FOUND",
      "La transferencia de inventario no existe.",
      {
        inventory_document_id: "No se encontró el documento solicitado.",
      },
    );
  }

  validateTransferDocumentType(document.document_type);

  if (document.status === InventoryDocumentStatus.RECEIVED) {
    return {
      inventoryDocumentId: document.inventory_document_id,

      outcome: "ALREADY_RECEIVED",
    };
  }

  if (document.status !== InventoryDocumentStatus.IN_TRANSIT) {
    throw new InventoryTransferError(
      "INVALID_DOCUMENT_STATUS",
      `La transferencia con estado ${document.status} no puede recibirse.`,
      {
        status: "Solo las transferencias despachadas pueden recibirse.",
      },
    );
  }

  if (document.lines.length === 0) {
    throw new InventoryTransferError(
      "EMPTY_DOCUMENT",
      "La transferencia debe contener al menos una línea.",
      {
        lines: "La transferencia no contiene líneas para recibir.",
      },
    );
  }

  const destinationLocation = resolveDestinationLocation(document);

  const receivedTimestamp = new Date();

  for (const line of document.lines) {
    const lineResult = await applyReceiveLine(
      transaction,
      line,
      destinationLocation.inventory_location_id,
    );

    if (!lineResult) {
      continue;
    }

    await transaction.inventoryDocumentLine.update({
      where: {
        inventory_document_line_id: line.inventory_document_line_id,
      },

      data: {
        received_stock_quantity: line.stock_quantity,
      },
    });

    await transaction.inventoryMovement.create({
      data: {
        inventory_document_id: document.inventory_document_id,

        inventory_document_line_id: line.inventory_document_line_id,

        inventory_product_variant_id: line.inventory_product_variant_id,

        inventory_location_id: destinationLocation.inventory_location_id,

        posting_key: buildReceivePostingKey(
          document.inventory_document_id,
          line.inventory_document_line_id,
        ),

        movement_type: InventoryMovementType.TRANSFER_RECEIPT,

        quantity_delta: lineResult.receivedQuantity,

        unit_cost: lineResult.unitCost,

        total_cost_delta: lineResult.totalCostDelta,

        movement_at: receivedTimestamp,

        notes: line.notes,
        created_by: null,
      },
    });
  }

  const updateResult = await transaction.inventoryDocument.updateMany({
    where: {
      inventory_document_id: document.inventory_document_id,

      status: InventoryDocumentStatus.IN_TRANSIT,
    },

    data: {
      status: InventoryDocumentStatus.RECEIVED,

      received_at: receivedTimestamp,
    },
  });

  if (updateResult.count !== 1) {
    throw new InventoryTransferError(
      "INVALID_DOCUMENT_STATUS",
      "La transferencia cambió de estado durante la recepción.",
      {
        status: "Actualice la transferencia e intente nuevamente.",
      },
    );
  }

  return {
    inventoryDocumentId: document.inventory_document_id,

    outcome: "RECEIVED",
  };
}

function isTransactionConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function receiveInventoryTransferRecord(
  inventoryDocumentId: string,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executeReceiveTransaction(transaction, inventoryDocumentId),

        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      lastError = error;

      if (
        !isTransactionConflict(error) ||
        attempt === MAX_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("No fue posible recibir la transferencia.");
}
