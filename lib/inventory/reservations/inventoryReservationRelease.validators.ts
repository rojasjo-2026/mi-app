import { InventoryValidationError } from "../shared/inventoryErrors";

import { normalizeCatalogUuid } from "../shared/inventoryCatalogValidation";

import {
  InventoryReservationReleaseError,
  type InventoryReservationReleaseInput,
} from "./inventoryReservationRelease.types";

const MAX_RELEASE_REASON_LENGTH = 1000;
const MAX_RELEASED_BY_LENGTH = 200;

export function normalizeInventoryReservationReleaseId(value: unknown) {
  try {
    return normalizeCatalogUuid(value, "El identificador de la reserva");
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      throw new InventoryReservationReleaseError(
        "INVALID_RESERVATION_ID",
        error.message,
        error.errors,
      );
    }

    throw error;
  }
}

export function normalizeInventoryReservationReleaseInput(
  value: unknown,
): InventoryReservationReleaseInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InventoryReservationReleaseError(
      "INVALID_REQUEST_BODY",
      "El contenido de la solicitud no es válido.",
      {
        body: "Proporcione un objeto con el motivo de liberación.",
      },
    );
  }

  const record = value as Record<string, unknown>;

  const releaseReason =
    typeof record.release_reason === "string"
      ? record.release_reason.trim()
      : "";

  if (!releaseReason) {
    throw new InventoryReservationReleaseError(
      "RELEASE_REASON_REQUIRED",
      "Debe indicar el motivo de liberación.",
      {
        release_reason: "Ingrese el motivo por el cual se libera la reserva.",
      },
    );
  }

  if (releaseReason.length > MAX_RELEASE_REASON_LENGTH) {
    throw new InventoryReservationReleaseError(
      "RELEASE_REASON_TOO_LONG",
      "El motivo de liberación es demasiado extenso.",
      {
        release_reason:
          `El motivo no puede superar ` +
          `${MAX_RELEASE_REASON_LENGTH} caracteres.`,
      },
    );
  }

  const releasedByValue = record.released_by;

  if (
    releasedByValue !== undefined &&
    releasedByValue !== null &&
    typeof releasedByValue !== "string"
  ) {
    throw new InventoryReservationReleaseError(
      "INVALID_RELEASED_BY",
      "El responsable de la liberación no es válido.",
      {
        released_by: "Proporcione texto o deje el campo vacío.",
      },
    );
  }

  const releasedBy =
    typeof releasedByValue === "string" ? releasedByValue.trim() || null : null;

  if (releasedBy && releasedBy.length > MAX_RELEASED_BY_LENGTH) {
    throw new InventoryReservationReleaseError(
      "RELEASED_BY_TOO_LONG",
      "El responsable de la liberación es demasiado extenso.",
      {
        released_by:
          `El responsable no puede superar ` +
          `${MAX_RELEASED_BY_LENGTH} caracteres.`,
      },
    );
  }

  return {
    releaseReason,
    releasedBy,
  };
}
