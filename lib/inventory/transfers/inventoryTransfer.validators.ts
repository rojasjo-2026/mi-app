import { InventoryDocumentType } from "@prisma/client";

import { InventoryTransferError } from "./inventoryTransfer.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeInventoryTransferId(value: unknown) {
  const inventoryDocumentId = typeof value === "string" ? value.trim() : "";

  if (!UUID_PATTERN.test(inventoryDocumentId)) {
    throw new InventoryTransferError(
      "INVALID_DOCUMENT_ID",
      "El identificador del documento de inventario no es válido.",
      {
        inventory_document_id: "Proporcione un identificador UUID válido.",
      },
    );
  }

  return inventoryDocumentId;
}

export function validateTransferDocumentType(
  documentType: InventoryDocumentType,
) {
  if (documentType !== InventoryDocumentType.TRANSFER) {
    throw new InventoryTransferError(
      "NOT_TRANSFER",
      "El documento solicitado no es una transferencia de inventario.",
      {
        document_type:
          "Esta operación solo está disponible para transferencias.",
      },
    );
  }
}

export function validateTransferLocations(
  sourceLocationId: string | null,
  destinationLocationId: string | null,
) {
  if (!sourceLocationId) {
    throw new InventoryTransferError(
      "SOURCE_LOCATION_REQUIRED",
      "La transferencia requiere una ubicación de origen.",
      {
        source_location_id:
          "Seleccione la ubicación desde la cual saldrá el inventario.",
      },
    );
  }

  if (!destinationLocationId) {
    throw new InventoryTransferError(
      "DESTINATION_LOCATION_REQUIRED",
      "La transferencia requiere una ubicación de destino.",
      {
        destination_location_id:
          "Seleccione la ubicación que recibirá el inventario.",
      },
    );
  }

  if (sourceLocationId === destinationLocationId) {
    throw new InventoryTransferError(
      "SAME_LOCATION",
      "La ubicación de origen y la ubicación de destino deben ser diferentes.",
      {
        destination_location_id:
          "Seleccione una ubicación diferente a la ubicación de origen.",
      },
    );
  }

  return {
    sourceLocationId,
    destinationLocationId,
  };
}
