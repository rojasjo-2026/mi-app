import { mapInventoryDocumentDetail } from "../documents/inventoryDocument.mapper";
import { findInventoryDocumentDetailById } from "../documents/inventoryDocument.repository";

import type { InventoryDocumentDetailResponse } from "../documents/inventoryDocument.types";
import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { receiveInventoryTransferRecord } from "./inventoryTransferReceive.repository";

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

function buildUnexpectedReceiveResponse(): InventoryServiceResult<InventoryDocumentDetailResponse> {
  return {
    status: 500,

    body: {
      success: false,
      message: "Ocurrió un error al recibir la transferencia de inventario.",
    },
  };
}

export async function receiveInventoryTransfer(
  inventoryDocumentIdValue: unknown,
): Promise<InventoryServiceResult<InventoryDocumentDetailResponse>> {
  try {
    const inventoryDocumentId = normalizeInventoryTransferId(
      inventoryDocumentIdValue,
    );

    const receiveResult =
      await receiveInventoryTransferRecord(inventoryDocumentId);

    const document = await findInventoryDocumentDetailById(
      receiveResult.inventoryDocumentId,
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
      receiveResult.outcome === "ALREADY_RECEIVED"
        ? "La transferencia ya había sido recibida. No se generaron movimientos adicionales."
        : "Transferencia de inventario recibida correctamente.";

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

    console.error("Inventory transfer receive error:", error);

    return buildUnexpectedReceiveResponse();
  }
}
