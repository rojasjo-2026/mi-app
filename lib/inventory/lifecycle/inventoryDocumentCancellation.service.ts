import { mapInventoryDocumentDetail } from "../documents/inventoryDocument.mapper";
import { findInventoryDocumentDetailById } from "../documents/inventoryDocument.repository";

import type { InventoryDocumentDetailResponse } from "../documents/inventoryDocument.types";
import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { cancelInventoryDocumentRecord } from "./inventoryDocumentCancellation.repository";

import { InventoryDocumentCancellationError } from "./inventoryDocumentCancellation.types";

import {
  normalizeInventoryDocumentCancellationId,
  normalizeInventoryDocumentCancellationInput,
} from "./inventoryDocumentCancellation.validators";

function resolveCancellationErrorStatus(
  error: InventoryDocumentCancellationError,
) {
  switch (error.code) {
    case "INVALID_DOCUMENT_ID":
    case "INVALID_REQUEST_BODY":
    case "CANCELLATION_REASON_REQUIRED":
    case "CANCELLATION_REASON_TOO_LONG":
      return 400;

    case "DOCUMENT_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildCancellationErrorResponse(
  error: InventoryDocumentCancellationError,
): InventoryServiceResult<InventoryDocumentDetailResponse> {
  return {
    status: resolveCancellationErrorStatus(error),

    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildUnexpectedCancellationResponse(): InventoryServiceResult<InventoryDocumentDetailResponse> {
  return {
    status: 500,

    body: {
      success: false,
      message: "Ocurrió un error al cancelar el documento de inventario.",
    },
  };
}

export async function cancelInventoryDocument(
  inventoryDocumentIdValue: unknown,
  inputValue: unknown,
): Promise<InventoryServiceResult<InventoryDocumentDetailResponse>> {
  try {
    const inventoryDocumentId = normalizeInventoryDocumentCancellationId(
      inventoryDocumentIdValue,
    );

    const input = normalizeInventoryDocumentCancellationInput(inputValue);

    const cancellationResult = await cancelInventoryDocumentRecord(
      inventoryDocumentId,
      input.cancellationReason,
    );

    const document = await findInventoryDocumentDetailById(
      cancellationResult.inventoryDocumentId,
    );

    if (!document) {
      return {
        status: 404,

        body: {
          success: false,
          message: "El documento de inventario no existe.",

          errors: {
            inventory_document_id: "No se encontró el documento solicitado.",
          },
        },
      };
    }

    const message =
      cancellationResult.outcome === "ALREADY_CANCELLED"
        ? "El documento ya había sido cancelado. No se realizaron cambios adicionales."
        : "Documento de inventario cancelado correctamente.";

    return {
      status: 200,

      body: {
        success: true,
        data: mapInventoryDocumentDetail(document),
        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryDocumentCancellationError) {
      return buildCancellationErrorResponse(error);
    }

    console.error("Inventory document cancellation error:", error);

    return buildUnexpectedCancellationResponse();
  }
}
