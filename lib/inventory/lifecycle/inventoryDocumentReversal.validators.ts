import {
  InventoryDocumentReversalError,
  type InventoryDocumentReversalInput,
} from "./inventoryDocumentReversal.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_REVERSAL_REASON_LENGTH = 1000;

export function normalizeInventoryDocumentReversalId(value: unknown) {
  const inventoryDocumentId = typeof value === "string" ? value.trim() : "";

  if (!UUID_PATTERN.test(inventoryDocumentId)) {
    throw new InventoryDocumentReversalError(
      "INVALID_DOCUMENT_ID",
      "El identificador del documento de inventario no es válido.",
      {
        inventory_document_id: "Proporcione un identificador UUID válido.",
      },
    );
  }

  return inventoryDocumentId;
}

export function normalizeInventoryDocumentReversalInput(
  value: unknown,
): InventoryDocumentReversalInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InventoryDocumentReversalError(
      "INVALID_REQUEST_BODY",
      "El contenido de la solicitud no es válido.",
      {
        body: "Proporcione un objeto con el motivo de reversión.",
      },
    );
  }

  const record = value as Record<string, unknown>;

  const reversalReason =
    typeof record.reversal_reason === "string"
      ? record.reversal_reason.trim()
      : "";

  if (!reversalReason) {
    throw new InventoryDocumentReversalError(
      "REVERSAL_REASON_REQUIRED",
      "Debe indicar el motivo de reversión.",
      {
        reversal_reason:
          "Ingrese el motivo por el cual se revierte el documento.",
      },
    );
  }

  if (reversalReason.length > MAX_REVERSAL_REASON_LENGTH) {
    throw new InventoryDocumentReversalError(
      "REVERSAL_REASON_TOO_LONG",
      "El motivo de reversión es demasiado extenso.",
      {
        reversal_reason: `El motivo no puede superar ${MAX_REVERSAL_REASON_LENGTH} caracteres.`,
      },
    );
  }

  return {
    reversalReason,
  };
}
