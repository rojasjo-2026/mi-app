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

const transferDocumentInclude =
  Prisma.validator<Prisma.InventoryDocumentInclude>()({
    source_location: {
      select: {
        inventory_location_id: true,
        location_code: true,
        name: true,
        allows_stock: true,
        is_active: true,
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

      include: {
        variant: {
          include: {
            product: {
              select: {
                inventory_product_id: true,
                name: true,
                manages_stock: true,
                allow_negative_stock: true,
                is_active: true,
              },
            },

            stock_unit: {
              select: {
                unit_of_measure_id: true,
                code: true,
                name: true,
                is_active: true,
              },
            },
          },
        },
      },
    },
  });

type TransferDocument = Prisma.InventoryDocumentGetPayload<{
  include: typeof transferDocumentInclude;
}>;

type TransferLine = TransferDocument["lines"][number];

type TransferLocation = NonNullable<TransferDocument["source_location"]>;

type TransferTransaction = Prisma.TransactionClient;

type DispatchLineResult = {
  quantityDelta: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  totalCostDelta: Prisma.Decimal;
};

function toDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

function roundMoney(value: Prisma.Decimal) {
  return value.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
}

function buildDispatchPostingKey(
  inventoryDocumentId: string,
  inventoryDocumentLineId: string,
) {
  return [
    "TRANSFER",
    "DISPATCH",
    inventoryDocumentId,
    inventoryDocumentLineId,
  ].join(":");
}

function buildLineErrorKey(line: TransferLine, field: string) {
  return `lines.${line.line_number}.${field}`;
}

function validateSourceLocation(location: TransferLocation) {
  if (!location.is_active) {
    throw new InventoryTransferError(
      "SOURCE_LOCATION_INACTIVE",
      `La ubicación de origen ${location.name} está inactiva.`,
      {
        source_location_id: "Seleccione una ubicación de origen activa.",
      },
    );
  }

  if (!location.allows_stock) {
    throw new InventoryTransferError(
      "SOURCE_LOCATION_STOCK_DISABLED",
      `La ubicación de origen ${location.name} no permite almacenar inventario.`,
      {
        source_location_id: "Seleccione una ubicación que permita existencias.",
      },
    );
  }
}

function validateDestinationLocation(location: TransferLocation) {
  if (!location.is_active) {
    throw new InventoryTransferError(
      "DESTINATION_LOCATION_INACTIVE",
      `La ubicación de destino ${location.name} está inactiva.`,
      {
        destination_location_id: "Seleccione una ubicación de destino activa.",
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

function resolveTransferLocations(document: TransferDocument) {
  const { sourceLocationId, destinationLocationId } = validateTransferLocations(
    document.source_location_id,
    document.destination_location_id,
  );

  const sourceLocation = document.source_location;

  if (
    !sourceLocation ||
    sourceLocation.inventory_location_id !== sourceLocationId
  ) {
    throw new InventoryTransferError(
      "SOURCE_LOCATION_REQUIRED",
      "No fue posible encontrar la ubicación de origen.",
      {
        source_location_id: "Seleccione una ubicación de origen válida.",
      },
    );
  }

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

  validateSourceLocation(sourceLocation);
  validateDestinationLocation(destinationLocation);

  return {
    sourceLocation,
    destinationLocation,
  };
}

function validateTransferLine(line: TransferLine) {
  const stockQuantity = toDecimal(line.stock_quantity);

  if (!stockQuantity.isFinite() || stockQuantity.lessThanOrEqualTo(0)) {
    throw new InventoryTransferError(
      "INVALID_LINE_QUANTITY",
      `La línea ${line.line_number} tiene una cantidad inválida.`,
      {
        [buildLineErrorKey(line, "stock_quantity")]:
          "La cantidad de inventario debe ser mayor que cero.",
      },
    );
  }

  if (!line.variant.product.is_active) {
    throw new InventoryTransferError(
      "PRODUCT_INACTIVE",
      `El producto ${line.variant.product.name} está inactivo.`,
      {
        [buildLineErrorKey(line, "inventory_product_variant_id")]:
          "El producto seleccionado está inactivo.",
      },
    );
  }

  if (!line.variant.product.manages_stock) {
    throw new InventoryTransferError(
      "PRODUCT_STOCK_DISABLED",
      `El producto ${line.variant.product.name} no administra existencias.`,
      {
        [buildLineErrorKey(line, "inventory_product_variant_id")]:
          "Seleccione un producto que administre existencias.",
      },
    );
  }

  if (!line.variant.is_active) {
    throw new InventoryTransferError(
      "VARIANT_INACTIVE",
      `La variante ${line.variant.name} está inactiva.`,
      {
        [buildLineErrorKey(line, "inventory_product_variant_id")]:
          "La variante seleccionada está inactiva.",
      },
    );
  }

  if (!line.variant.stock_unit.is_active) {
    throw new InventoryTransferError(
      "STOCK_UNIT_INACTIVE",
      `La unidad ${line.variant.stock_unit.code} está inactiva.`,
      {
        [buildLineErrorKey(line, "unit_of_measure_id")]:
          "La unidad de inventario está inactiva.",
      },
    );
  }

  return stockQuantity;
}

async function findCurrentBalance(
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

async function applyDispatchLine(
  transaction: TransferTransaction,
  line: TransferLine,
  sourceLocationId: string,
): Promise<DispatchLineResult> {
  const stockQuantity = validateTransferLine(line);

  const balance = await findCurrentBalance(
    transaction,
    line.inventory_product_variant_id,
    sourceLocationId,
  );

  const quantityOnHand = balance
    ? toDecimal(balance.quantity_on_hand)
    : toDecimal(0);

  const quantityReserved = balance
    ? toDecimal(balance.quantity_reserved)
    : toDecimal(0);

  const availableQuantity = quantityOnHand.minus(quantityReserved);

  if (
    !line.variant.product.allow_negative_stock &&
    availableQuantity.lessThan(stockQuantity)
  ) {
    throw new InventoryTransferError(
      "INSUFFICIENT_STOCK",
      `No hay existencias suficientes para ${line.variant.product.name}.`,
      {
        [buildLineErrorKey(line, "stock_quantity")]:
          `Disponible: ${availableQuantity.toString()}. ` +
          `Solicitado: ${stockQuantity.toString()}.`,
      },
    );
  }

  const postingUnitCost = balance
    ? toDecimal(balance.average_unit_cost)
    : toDecimal(line.unit_cost);

  const newQuantity = quantityOnHand.minus(stockQuantity);

  if (balance) {
    await transaction.inventoryStockBalance.update({
      where: {
        inventory_stock_balance_id: balance.inventory_stock_balance_id,
      },

      data: {
        quantity_on_hand: newQuantity,

        version: {
          increment: 1,
        },
      },
    });
  } else {
    await transaction.inventoryStockBalance.create({
      data: {
        inventory_product_variant_id: line.inventory_product_variant_id,

        inventory_location_id: sourceLocationId,

        quantity_on_hand: newQuantity,
        quantity_reserved: toDecimal(0),

        average_unit_cost: postingUnitCost,
      },
    });
  }

  const lineTotal = roundMoney(stockQuantity.times(postingUnitCost));

  return {
    quantityDelta: stockQuantity.negated(),
    unitCost: postingUnitCost,
    lineTotal,
    totalCostDelta: lineTotal.negated(),
  };
}

async function executeDispatchTransaction(
  transaction: TransferTransaction,
  inventoryDocumentId: string,
): Promise<InventoryTransferTransactionResult> {
  const document = await transaction.inventoryDocument.findUnique({
    where: {
      inventory_document_id: inventoryDocumentId,
    },

    include: transferDocumentInclude,
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

  if (
    document.status === InventoryDocumentStatus.IN_TRANSIT ||
    document.status === InventoryDocumentStatus.PARTIALLY_RECEIVED ||
    document.status === InventoryDocumentStatus.RECEIVED
  ) {
    return {
      inventoryDocumentId: document.inventory_document_id,

      outcome: "ALREADY_DISPATCHED",
    };
  }

  if (document.status !== InventoryDocumentStatus.DRAFT) {
    throw new InventoryTransferError(
      "INVALID_DOCUMENT_STATUS",
      `La transferencia con estado ${document.status} no puede despacharse.`,
      {
        status: "Solo las transferencias en borrador pueden despacharse.",
      },
    );
  }

  if (document.lines.length === 0) {
    throw new InventoryTransferError(
      "EMPTY_DOCUMENT",
      "La transferencia debe contener al menos una línea.",
      {
        lines: "Agregue al menos una línea antes de despachar.",
      },
    );
  }

  const { sourceLocation } = resolveTransferLocations(document);

  const dispatchTimestamp = new Date();

  let documentTotal = toDecimal(0);

  for (const line of document.lines) {
    const lineResult = await applyDispatchLine(
      transaction,
      line,
      sourceLocation.inventory_location_id,
    );

    await transaction.inventoryDocumentLine.update({
      where: {
        inventory_document_line_id: line.inventory_document_line_id,
      },

      data: {
        unit_cost: lineResult.unitCost,
        total_cost: lineResult.lineTotal,
      },
    });

    await transaction.inventoryMovement.create({
      data: {
        inventory_document_id: document.inventory_document_id,

        inventory_document_line_id: line.inventory_document_line_id,

        inventory_product_variant_id: line.inventory_product_variant_id,

        inventory_location_id: sourceLocation.inventory_location_id,

        posting_key: buildDispatchPostingKey(
          document.inventory_document_id,
          line.inventory_document_line_id,
        ),

        movement_type: InventoryMovementType.TRANSFER_DISPATCH,

        quantity_delta: lineResult.quantityDelta,

        unit_cost: lineResult.unitCost,

        total_cost_delta: lineResult.totalCostDelta,

        movement_at: dispatchTimestamp,
        notes: line.notes,
        created_by: null,
      },
    });

    documentTotal = documentTotal.plus(lineResult.lineTotal);
  }

  const updateResult = await transaction.inventoryDocument.updateMany({
    where: {
      inventory_document_id: document.inventory_document_id,

      status: InventoryDocumentStatus.DRAFT,
    },

    data: {
      status: InventoryDocumentStatus.IN_TRANSIT,

      total_cost: roundMoney(documentTotal),

      posted_at: dispatchTimestamp,
    },
  });

  if (updateResult.count !== 1) {
    throw new InventoryTransferError(
      "INVALID_DOCUMENT_STATUS",
      "La transferencia cambió de estado durante el despacho.",
      {
        status: "Actualice la transferencia e intente nuevamente.",
      },
    );
  }

  return {
    inventoryDocumentId: document.inventory_document_id,

    outcome: "DISPATCHED",
  };
}

function isTransactionConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function dispatchInventoryTransferRecord(
  inventoryDocumentId: string,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executeDispatchTransaction(transaction, inventoryDocumentId),

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

  throw lastError ?? new Error("No fue posible despachar la transferencia.");
}
