import {
  InventoryDocumentStatus,
  InventoryDocumentType,
  InventoryMovementType,
  Prisma,
} from "@prisma/client";

import { InventoryDocumentReversalError } from "./inventoryDocumentReversal.types";

type ReversalTransaction = Prisma.TransactionClient;

const reversalDocumentInclude = {
  lines: {
    orderBy: {
      line_number: "asc",
    },
  },

  movements: {
    orderBy: {
      created_at: "asc",
    },

    select: {
      inventory_movement_id: true,
      reversal_of_movement_id: true,
      inventory_document_line_id: true,
      inventory_product_variant_id: true,
      inventory_location_id: true,
      movement_type: true,
      quantity_delta: true,
      unit_cost: true,
      total_cost_delta: true,

      reversal_movement: {
        select: {
          inventory_movement_id: true,
        },
      },

      variant: {
        select: {
          product: {
            select: {
              name: true,
              allow_negative_stock: true,
            },
          },
        },
      },
    },
  },

  reversal_document: {
    select: {
      inventory_document_id: true,
    },
  },
} satisfies Prisma.InventoryDocumentInclude;

export type InventoryDocumentForReversal = Prisma.InventoryDocumentGetPayload<{
  include: typeof reversalDocumentInclude;
}>;

function validateDocumentStatus(document: InventoryDocumentForReversal) {
  if (document.document_type === InventoryDocumentType.TRANSFER) {
    if (document.status !== InventoryDocumentStatus.RECEIVED) {
      throw new InventoryDocumentReversalError(
        "INVALID_DOCUMENT_STATUS",
        `La transferencia con estado ${document.status} no puede revertirse.`,
        {
          status: "Solo las transferencias recibidas pueden revertirse.",
        },
      );
    }

    return;
  }

  if (document.status !== InventoryDocumentStatus.POSTED) {
    throw new InventoryDocumentReversalError(
      "INVALID_DOCUMENT_STATUS",
      `El documento con estado ${document.status} no puede revertirse.`,
      {
        status: "Solo los documentos publicados pueden revertirse.",
      },
    );
  }
}

function validateDocumentStructure(document: InventoryDocumentForReversal) {
  if (document.lines.length === 0) {
    throw new InventoryDocumentReversalError(
      "DOCUMENT_WITHOUT_LINES",
      "El documento no contiene líneas para revertir.",
      {
        lines: "El documento debe contener al menos una línea.",
      },
    );
  }

  if (document.movements.length === 0) {
    throw new InventoryDocumentReversalError(
      "DOCUMENT_WITHOUT_MOVEMENTS",
      "El documento no contiene movimientos para revertir.",
      {
        movements: "El documento debe contener movimientos publicados.",
      },
    );
  }

  const lineIds = new Set(
    document.lines.map((line) => line.inventory_document_line_id),
  );

  const movementLineIds = new Set(
    document.movements.map((movement) => movement.inventory_document_line_id),
  );

  for (const lineId of lineIds) {
    if (!movementLineIds.has(lineId)) {
      throw new InventoryDocumentReversalError(
        "REVERSAL_STATE_CONFLICT",
        "El documento contiene líneas sin movimientos publicados.",
        {
          [`lines.${lineId}`]: "No se encontró el movimiento correspondiente.",
        },
      );
    }
  }

  for (const movement of document.movements) {
    if (!lineIds.has(movement.inventory_document_line_id)) {
      throw new InventoryDocumentReversalError(
        "REVERSAL_STATE_CONFLICT",
        "El documento contiene movimientos sin una línea válida.",
        {
          movements: "Existe un movimiento asociado a una línea inexistente.",
        },
      );
    }

    if (
      movement.movement_type === InventoryMovementType.REVERSAL ||
      movement.reversal_of_movement_id
    ) {
      throw new InventoryDocumentReversalError(
        "REVERSAL_DOCUMENT_NOT_ALLOWED",
        "Un movimiento de reversión no puede revertirse nuevamente.",
        {
          movements:
            "Seleccione el documento original que generó los movimientos.",
        },
      );
    }

    if (movement.reversal_movement) {
      throw new InventoryDocumentReversalError(
        "MOVEMENT_ALREADY_REVERSED",
        "Uno o más movimientos del documento ya fueron revertidos.",
        {
          movements: "Actualice el documento antes de intentar la reversión.",
        },
      );
    }
  }
}

function validateOriginalDocument(document: InventoryDocumentForReversal) {
  if (document.reversal_of_document_id) {
    throw new InventoryDocumentReversalError(
      "REVERSAL_DOCUMENT_NOT_ALLOWED",
      "Un documento de reversión no puede revertirse nuevamente.",
      {
        inventory_document_id: "Seleccione el documento original.",
      },
    );
  }

  if (document.status === InventoryDocumentStatus.REVERSED) {
    if (document.reversal_document) {
      return;
    }

    throw new InventoryDocumentReversalError(
      "REVERSAL_STATE_CONFLICT",
      "El documento figura como revertido, pero no tiene un documento de reversión asociado.",
      {
        status: "Revise la integridad del documento antes de continuar.",
      },
    );
  }

  if (document.reversal_document) {
    throw new InventoryDocumentReversalError(
      "REVERSAL_STATE_CONFLICT",
      "El documento ya tiene una reversión asociada, pero su estado no coincide.",
      {
        status: "Actualice el documento y revise su estado.",
      },
    );
  }

  validateDocumentStatus(document);
  validateDocumentStructure(document);
}

export async function findInventoryDocumentForReversal(
  transaction: ReversalTransaction,
  inventoryDocumentId: string,
): Promise<InventoryDocumentForReversal> {
  const document = await transaction.inventoryDocument.findUnique({
    where: {
      inventory_document_id: inventoryDocumentId,
    },

    include: reversalDocumentInclude,
  });

  if (!document) {
    throw new InventoryDocumentReversalError(
      "DOCUMENT_NOT_FOUND",
      "El documento de inventario no existe.",
      {
        inventory_document_id: "No se encontró el documento solicitado.",
      },
    );
  }

  validateOriginalDocument(document);

  return document;
}
