import { randomUUID } from "node:crypto";

import {
  InventoryDocumentStatus,
  InventoryDocumentType,
  InventoryMovementType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  applyInventoryDocumentReversalBalances,
  type ReversalSourceMovement,
} from "./inventoryDocumentReversalBalance.repository";

import {
  findInventoryDocumentForReversal,
  type InventoryDocumentForReversal,
} from "./inventoryDocumentReversalSource.repository";

import {
  InventoryDocumentReversalError,
  type InventoryDocumentReversalTransactionResult,
} from "./inventoryDocumentReversal.types";

const MAX_TRANSACTION_ATTEMPTS = 3;

type ReversalTransaction = Prisma.TransactionClient;

function buildReversalDocumentNumber(timestamp: Date) {
  const datePart = timestamp.toISOString().slice(0, 10).replaceAll("-", "");

  const uniquePart = randomUUID().slice(0, 8).toUpperCase();

  return `STK-REV-${datePart}-` + `${timestamp.getTime()}-` + uniquePart;
}

function buildReversalIdempotencyKey(inventoryDocumentId: string) {
  return "INVENTORY_REVERSAL:" + inventoryDocumentId;
}

function buildReversalPostingKey(inventoryMovementId: string) {
  return "REVERSAL:" + inventoryMovementId;
}

function resolveReversalDocumentStatus(documentType: InventoryDocumentType) {
  return documentType === InventoryDocumentType.TRANSFER
    ? InventoryDocumentStatus.RECEIVED
    : InventoryDocumentStatus.POSTED;
}

function resolveReversalSourceLocationId(
  document: InventoryDocumentForReversal,
) {
  if (document.document_type === InventoryDocumentType.TRANSFER) {
    return document.destination_location_id;
  }

  return document.source_location_id;
}

function resolveReversalDestinationLocationId(
  document: InventoryDocumentForReversal,
) {
  if (document.document_type === InventoryDocumentType.TRANSFER) {
    return document.source_location_id;
  }

  return document.destination_location_id;
}

async function createReversalDocument(
  transaction: ReversalTransaction,
  document: InventoryDocumentForReversal,
  reversalReason: string,
  reversalTimestamp: Date,
) {
  const reversalStatus = resolveReversalDocumentStatus(document.document_type);

  return transaction.inventoryDocument.create({
    data: {
      reversal_of_document_id: document.inventory_document_id,

      source_location_id: resolveReversalSourceLocationId(document),

      destination_location_id: resolveReversalDestinationLocationId(document),

      document_number: buildReversalDocumentNumber(reversalTimestamp),

      document_type: document.document_type,

      status: reversalStatus,

      document_date: reversalTimestamp,

      reference_type: "INVENTORY_REVERSAL",

      reference_id: document.inventory_document_id,

      reference_number: document.document_number,

      idempotency_key: buildReversalIdempotencyKey(
        document.inventory_document_id,
      ),

      total_cost: document.total_cost,

      notes: `Reversión del documento ${document.document_number}.`,

      cancellation_reason: null,

      reversal_reason: reversalReason,

      created_by: null,
      posted_by: null,
      received_by: null,
      cancelled_by: null,
      reversed_by: null,

      posted_at: reversalTimestamp,

      received_at:
        reversalStatus === InventoryDocumentStatus.RECEIVED
          ? reversalTimestamp
          : null,

      cancelled_at: null,
      reversed_at: null,
    },

    select: {
      inventory_document_id: true,
    },
  });
}

async function copyReversalLines(
  transaction: ReversalTransaction,
  document: InventoryDocumentForReversal,
  reversalDocumentId: string,
) {
  const lineIdMap = new Map<string, string>();

  const isTransfer = document.document_type === InventoryDocumentType.TRANSFER;

  for (const line of document.lines) {
    const reversalLine = await transaction.inventoryDocumentLine.create({
      data: {
        inventory_document_id: reversalDocumentId,

        inventory_product_variant_id: line.inventory_product_variant_id,

        inventory_product_code_id: line.inventory_product_code_id,

        unit_of_measure_id: line.unit_of_measure_id,

        line_number: line.line_number,

        quantity: line.quantity,

        conversion_factor: line.conversion_factor,

        stock_quantity: line.stock_quantity,

        received_stock_quantity: isTransfer
          ? line.stock_quantity
          : line.received_stock_quantity,

        unit_cost: line.unit_cost,

        total_cost: line.total_cost,

        product_name_snapshot: line.product_name_snapshot,

        variant_name_snapshot: line.variant_name_snapshot,

        unit_code_snapshot: line.unit_code_snapshot,

        code_snapshot: line.code_snapshot,

        notes: line.notes,
      },

      select: {
        inventory_document_line_id: true,
      },
    });

    lineIdMap.set(
      line.inventory_document_line_id,
      reversalLine.inventory_document_line_id,
    );
  }

  return lineIdMap;
}

async function createReversalMovements(
  transaction: ReversalTransaction,
  document: InventoryDocumentForReversal,
  reversalDocumentId: string,
  reversalLineIds: Map<string, string>,
  reversalReason: string,
  reversalTimestamp: Date,
) {
  for (const movement of document.movements) {
    const reversalDocumentLineId = reversalLineIds.get(
      movement.inventory_document_line_id,
    );

    if (!reversalDocumentLineId) {
      throw new InventoryDocumentReversalError(
        "REVERSAL_STATE_CONFLICT",
        "No fue posible asociar el movimiento con su línea de reversión.",
        {
          movements: "La relación entre líneas y movimientos es inválida.",
        },
      );
    }

    await transaction.inventoryMovement.create({
      data: {
        reversal_of_movement_id: movement.inventory_movement_id,

        inventory_document_id: reversalDocumentId,

        inventory_document_line_id: reversalDocumentLineId,

        inventory_product_variant_id: movement.inventory_product_variant_id,

        inventory_location_id: movement.inventory_location_id,

        posting_key: buildReversalPostingKey(movement.inventory_movement_id),

        movement_type: InventoryMovementType.REVERSAL,

        quantity_delta: movement.quantity_delta.negated(),

        unit_cost: movement.unit_cost,

        total_cost_delta: movement.total_cost_delta.negated(),

        movement_at: reversalTimestamp,

        notes: reversalReason,

        created_by: null,
      },
    });
  }
}

async function markOriginalDocumentReversed(
  transaction: ReversalTransaction,
  document: InventoryDocumentForReversal,
  reversalReason: string,
  reversalTimestamp: Date,
) {
  const updateResult = await transaction.inventoryDocument.updateMany({
    where: {
      inventory_document_id: document.inventory_document_id,

      status: document.status,
    },

    data: {
      status: InventoryDocumentStatus.REVERSED,

      reversal_reason: reversalReason,

      reversed_by: null,

      reversed_at: reversalTimestamp,
    },
  });

  if (updateResult.count !== 1) {
    throw new InventoryDocumentReversalError(
      "REVERSAL_STATE_CONFLICT",
      "El documento cambió de estado durante la reversión.",
      {
        status: "Actualice el documento e intente nuevamente.",
      },
    );
  }
}

async function executeReversalTransaction(
  transaction: ReversalTransaction,
  inventoryDocumentId: string,
  reversalReason: string,
): Promise<InventoryDocumentReversalTransactionResult> {
  const document = await findInventoryDocumentForReversal(
    transaction,
    inventoryDocumentId,
  );

  if (
    document.status === InventoryDocumentStatus.REVERSED &&
    document.reversal_document
  ) {
    return {
      originalDocumentId: document.inventory_document_id,

      reversalDocumentId: document.reversal_document.inventory_document_id,

      outcome: "ALREADY_REVERSED",
    };
  }

  const reversalTimestamp = new Date();

  const reversalDocument = await createReversalDocument(
    transaction,
    document,
    reversalReason,
    reversalTimestamp,
  );

  const reversalLineIds = await copyReversalLines(
    transaction,
    document,
    reversalDocument.inventory_document_id,
  );

  await applyInventoryDocumentReversalBalances(
    transaction,
    document.movements as ReversalSourceMovement[],
  );

  await createReversalMovements(
    transaction,
    document,
    reversalDocument.inventory_document_id,
    reversalLineIds,
    reversalReason,
    reversalTimestamp,
  );

  await markOriginalDocumentReversed(
    transaction,
    document,
    reversalReason,
    reversalTimestamp,
  );

  return {
    originalDocumentId: document.inventory_document_id,

    reversalDocumentId: reversalDocument.inventory_document_id,

    outcome: "REVERSED",
  };
}

function isRetryableTransactionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2034" || error.code === "P2002")
  );
}

export async function reverseInventoryDocumentRecord(
  inventoryDocumentId: string,
  reversalReason: string,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executeReversalTransaction(
            transaction,
            inventoryDocumentId,
            reversalReason,
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
    lastError ??
    new Error("No fue posible revertir el documento de inventario.")
  );
}
