import { InventoryDocumentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  InventoryDocumentCancellationError,
  type InventoryDocumentCancellationTransactionResult,
} from "./inventoryDocumentCancellation.types";

const MAX_TRANSACTION_ATTEMPTS = 3;

type CancellationTransaction = Prisma.TransactionClient;

async function executeCancellationTransaction(
  transaction: CancellationTransaction,
  inventoryDocumentId: string,
  cancellationReason: string,
): Promise<InventoryDocumentCancellationTransactionResult> {
  const document = await transaction.inventoryDocument.findUnique({
    where: {
      inventory_document_id: inventoryDocumentId,
    },

    select: {
      inventory_document_id: true,
      status: true,
    },
  });

  if (!document) {
    throw new InventoryDocumentCancellationError(
      "DOCUMENT_NOT_FOUND",
      "El documento de inventario no existe.",
      {
        inventory_document_id: "No se encontró el documento solicitado.",
      },
    );
  }

  if (document.status === InventoryDocumentStatus.CANCELLED) {
    return {
      inventoryDocumentId: document.inventory_document_id,

      outcome: "ALREADY_CANCELLED",
    };
  }

  if (document.status !== InventoryDocumentStatus.DRAFT) {
    throw new InventoryDocumentCancellationError(
      "INVALID_DOCUMENT_STATUS",
      `El documento con estado ${document.status} no puede cancelarse.`,
      {
        status: "Solo los documentos en borrador pueden cancelarse.",
      },
    );
  }

  const cancellationTimestamp = new Date();

  const updateResult = await transaction.inventoryDocument.updateMany({
    where: {
      inventory_document_id: document.inventory_document_id,

      status: InventoryDocumentStatus.DRAFT,
    },

    data: {
      status: InventoryDocumentStatus.CANCELLED,

      cancellation_reason: cancellationReason,

      cancelled_by: null,

      cancelled_at: cancellationTimestamp,
    },
  });

  if (updateResult.count === 1) {
    return {
      inventoryDocumentId: document.inventory_document_id,

      outcome: "CANCELLED",
    };
  }

  const currentDocument = await transaction.inventoryDocument.findUnique({
    where: {
      inventory_document_id: document.inventory_document_id,
    },

    select: {
      status: true,
    },
  });

  if (currentDocument?.status === InventoryDocumentStatus.CANCELLED) {
    return {
      inventoryDocumentId: document.inventory_document_id,

      outcome: "ALREADY_CANCELLED",
    };
  }

  throw new InventoryDocumentCancellationError(
    "INVALID_DOCUMENT_STATUS",
    "El documento cambió de estado durante la cancelación.",
    {
      status: "Actualice el documento e intente nuevamente.",
    },
  );
}

function isTransactionConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function cancelInventoryDocumentRecord(
  inventoryDocumentId: string,
  cancellationReason: string,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executeCancellationTransaction(
            transaction,
            inventoryDocumentId,
            cancellationReason,
          ),

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

  throw (
    lastError ??
    new Error("No fue posible cancelar el documento de inventario.")
  );
}
