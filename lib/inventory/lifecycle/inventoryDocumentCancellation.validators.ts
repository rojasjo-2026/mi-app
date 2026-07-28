import {
  InventoryDocumentCancellationError,
  type InventoryDocumentCancellationInput,
} from "./inventoryDocumentCancellation.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_CANCELLATION_REASON_LENGTH = 1000;

export function normalizeInventoryDocumentCancellationId(value: unknown) {
  const inventoryDocumentId = typeof value === "string" ? value.trim() : "";

  if (!UUID_PATTERN.test(inventoryDocumentId)) {
    throw new InventoryDocumentCancellationError(
      "INVALID_DOCUMENT_ID",
      "El identificador del documento de inventario no es válido.",
      {
        inventory_document_id: "Proporcione un identificador UUID válido.",
      },
    );
  }

  return inventoryDocumentId;
}

export function normalizeInventoryDocumentCancellationInput(
  value: unknown,
): InventoryDocumentCancellationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InventoryDocumentCancellationError(
      "INVALID_REQUEST_BODY",
      "El contenido de la solicitud no es válido.",
      {
        body: "Proporcione un objeto con el motivo de cancelación.",
      },
    );
  }

  const record = value as Record<string, unknown>;

  const cancellationReason =
    typeof record.cancellation_reason === "string"
      ? record.cancellation_reason.trim()
      : "";

  if (!cancellationReason) {
    throw new InventoryDocumentCancellationError(
      "CANCELLATION_REASON_REQUIRED",
      "Debe indicar el motivo de cancelación.",
      {
        cancellation_reason:
          "Ingrese el motivo por el cual se cancela el documento.",
      },
    );
  }

  if (cancellationReason.length > MAX_CANCELLATION_REASON_LENGTH) {
    throw new InventoryDocumentCancellationError(
      "CANCELLATION_REASON_TOO_LONG",
      "El motivo de cancelación es demasiado extenso.",
      {
        cancellation_reason: `El motivo no puede superar ${MAX_CANCELLATION_REASON_LENGTH} caracteres.`,
      },
    );
  }

  return {
    cancellationReason,
  };
}
