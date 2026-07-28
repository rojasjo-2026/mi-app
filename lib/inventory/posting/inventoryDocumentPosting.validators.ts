import { InventoryDocumentType } from "@prisma/client";

import {
  InventoryDocumentPostingError,
  type InventoryDocumentPostingDirection,
} from "./inventoryDocumentPosting.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeInventoryDocumentPostingId(value: unknown) {
  if (typeof value !== "string") {
    throw new InventoryDocumentPostingError(
      "INVALID_DOCUMENT_ID",
      "El identificador del documento no es válido.",
      {
        inventory_document_id: "Ingrese un identificador UUID válido.",
      },
    );
  }

  const normalizedValue = value.trim();

  if (!UUID_PATTERN.test(normalizedValue)) {
    throw new InventoryDocumentPostingError(
      "INVALID_DOCUMENT_ID",
      "El identificador del documento no es válido.",
      {
        inventory_document_id: "Ingrese un identificador UUID válido.",
      },
    );
  }

  return normalizedValue;
}

export function resolveInventoryDocumentPostingDirection(
  documentType: InventoryDocumentType,
): InventoryDocumentPostingDirection {
  switch (documentType) {
    case InventoryDocumentType.OPENING_BALANCE:
    case InventoryDocumentType.RECEIPT:
    case InventoryDocumentType.ADJUSTMENT_INCREASE:
    case InventoryDocumentType.RETURN_IN:
      return "INBOUND";

    case InventoryDocumentType.ISSUE:
    case InventoryDocumentType.ADJUSTMENT_DECREASE:
    case InventoryDocumentType.RETURN_OUT:
      return "OUTBOUND";

    case InventoryDocumentType.TRANSFER:
      throw new InventoryDocumentPostingError(
        "TRANSFER_NOT_SUPPORTED",
        "Las transferencias requieren el flujo de despacho y recepción.",
        {
          document_type:
            "La publicación de transferencias se implementará en su flujo específico.",
        },
      );
  }
}

export function getInventoryDocumentPostingLocationField(
  direction: InventoryDocumentPostingDirection,
) {
  return direction === "INBOUND"
    ? "destination_location_id"
    : "source_location_id";
}
