import { mapInventoryDocumentDetail } from "../documents/inventoryDocument.mapper";
import { findInventoryDocumentDetailById } from "../documents/inventoryDocument.repository";

import type { InventoryDocumentDetailResponse } from "../documents/inventoryDocument.types";
import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { dispatchInventoryTransferRecord } from "./inventoryTransferDispatch.repository";

import { InventoryTransferError } from "./inventoryTransfer.types";

import { normalizeInventoryTransferId } from "./inventoryTransfer.validators";

function resolveTransferErrorStatus(error: InventoryTransferError) {
  switch (error.code) {
    case "INVALID_DOCUMENT_ID":
      return 400;

    case "DOCUMENT_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildTransferErrorResponse(
  error: InventoryTransferError,
): InventoryServiceResult<InventoryDocumentDetailResponse> {
  return {
    status: resolveTransferErrorStatus(error),

    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildUnexpectedDispatchResponse(): InventoryServiceResult<InventoryDocumentDetailResponse> {
  return {
    status: 500,

    body: {
      success: false,
      message: "Ocurrió un error al despachar la transferencia de inventario.",
    },
  };
}

export async function dispatchInventoryTransfer(
  inventoryDocumentIdValue: unknown,
): Promise<InventoryServiceResult<InventoryDocumentDetailResponse>> {
  try {
    const inventoryDocumentId = normalizeInventoryTransferId(
      inventoryDocumentIdValue,
    );

    const dispatchResult =
      await dispatchInventoryTransferRecord(inventoryDocumentId);

    const document = await findInventoryDocumentDetailById(
      dispatchResult.inventoryDocumentId,
    );

    if (!document) {
      return {
        status: 404,

        body: {
          success: false,
          message: "La transferencia de inventario no existe.",

          errors: {
            inventory_document_id: "No se encontró el documento solicitado.",
          },
        },
      };
    }

    const message =
      dispatchResult.outcome === "ALREADY_DISPATCHED"
        ? "La transferencia ya había sido despachada. No se generaron movimientos adicionales."
        : "Transferencia de inventario despachada correctamente.";

    return {
      status: 200,

      body: {
        success: true,
        data: mapInventoryDocumentDetail(document),
        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryTransferError) {
      return buildTransferErrorResponse(error);
    }

    console.error("Inventory transfer dispatch error:", error);

    return buildUnexpectedDispatchResponse();
  }
}
