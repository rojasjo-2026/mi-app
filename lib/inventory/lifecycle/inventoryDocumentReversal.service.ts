import { mapInventoryDocumentDetail } from "../documents/inventoryDocument.mapper";
import { findInventoryDocumentDetailById } from "../documents/inventoryDocument.repository";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { reverseInventoryDocumentRecord } from "./inventoryDocumentReversal.repository";

import {
  InventoryDocumentReversalError,
  type InventoryDocumentReversalResponse,
} from "./inventoryDocumentReversal.types";

import {
  normalizeInventoryDocumentReversalId,
  normalizeInventoryDocumentReversalInput,
} from "./inventoryDocumentReversal.validators";

function resolveReversalErrorStatus(error: InventoryDocumentReversalError) {
  switch (error.code) {
    case "INVALID_DOCUMENT_ID":
    case "INVALID_REQUEST_BODY":
    case "REVERSAL_REASON_REQUIRED":
    case "REVERSAL_REASON_TOO_LONG":
      return 400;

    case "DOCUMENT_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildReversalErrorResponse(
  error: InventoryDocumentReversalError,
): InventoryServiceResult<InventoryDocumentReversalResponse> {
  return {
    status: resolveReversalErrorStatus(error),

    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildUnexpectedReversalResponse(
  message = "Ocurrió un error al revertir el documento de inventario.",
): InventoryServiceResult<InventoryDocumentReversalResponse> {
  return {
    status: 500,

    body: {
      success: false,
      message,
    },
  };
}

export async function reverseInventoryDocument(
  inventoryDocumentIdValue: unknown,
  inputValue: unknown,
): Promise<InventoryServiceResult<InventoryDocumentReversalResponse>> {
  try {
    const inventoryDocumentId = normalizeInventoryDocumentReversalId(
      inventoryDocumentIdValue,
    );

    const input = normalizeInventoryDocumentReversalInput(inputValue);

    const reversalResult = await reverseInventoryDocumentRecord(
      inventoryDocumentId,
      input.reversalReason,
    );

    const [originalDocument, reversalDocument] = await Promise.all([
      findInventoryDocumentDetailById(reversalResult.originalDocumentId),

      findInventoryDocumentDetailById(reversalResult.reversalDocumentId),
    ]);

    if (!originalDocument || !reversalDocument) {
      return buildUnexpectedReversalResponse(
        "La reversión fue procesada, pero no fue posible recuperar todos los documentos generados.",
      );
    }

    const message =
      reversalResult.outcome === "ALREADY_REVERSED"
        ? "El documento ya había sido revertido. No se realizaron movimientos adicionales."
        : "Documento de inventario revertido correctamente.";

    return {
      status: 200,

      body: {
        success: true,

        data: {
          original_document: mapInventoryDocumentDetail(originalDocument),

          reversal_document: mapInventoryDocumentDetail(reversalDocument),
        },

        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryDocumentReversalError) {
      return buildReversalErrorResponse(error);
    }

    console.error("Inventory document reversal error:", error);

    return buildUnexpectedReversalResponse();
  }
}
