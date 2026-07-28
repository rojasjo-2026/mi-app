import { mapInventoryDocumentDetail } from "../documents/inventoryDocument.mapper";
import { findInventoryDocumentDetailById } from "../documents/inventoryDocument.repository";

import type { InventoryDocumentDetailResponse } from "../documents/inventoryDocument.types";
import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { postInventoryDocumentRecord } from "./inventoryDocumentPosting.repository";

import { InventoryDocumentPostingError } from "./inventoryDocumentPosting.types";

import { normalizeInventoryDocumentPostingId } from "./inventoryDocumentPosting.validators";

function resolvePostingErrorStatus(error: InventoryDocumentPostingError) {
  switch (error.code) {
    case "INVALID_DOCUMENT_ID":
      return 400;

    case "DOCUMENT_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildPostingErrorResponse(
  error: InventoryDocumentPostingError,
): InventoryServiceResult<InventoryDocumentDetailResponse> {
  return {
    status: resolvePostingErrorStatus(error),
    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildUnexpectedPostingResponse(): InventoryServiceResult<InventoryDocumentDetailResponse> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al publicar el documento de inventario.",
    },
  };
}

export async function postInventoryDocument(
  inventoryDocumentIdValue: unknown,
): Promise<InventoryServiceResult<InventoryDocumentDetailResponse>> {
  try {
    const inventoryDocumentId = normalizeInventoryDocumentPostingId(
      inventoryDocumentIdValue,
    );

    const postingResult =
      await postInventoryDocumentRecord(inventoryDocumentId);

    const document = await findInventoryDocumentDetailById(
      postingResult.inventoryDocumentId,
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
      postingResult.outcome === "ALREADY_POSTED"
        ? "El documento ya estaba publicado. No se generaron movimientos adicionales."
        : "Documento de inventario publicado correctamente.";

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryDocumentDetail(document),
        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryDocumentPostingError) {
      return buildPostingErrorResponse(error);
    }

    console.error("Inventory document posting error:", error);

    return buildUnexpectedPostingResponse();
  }
}
