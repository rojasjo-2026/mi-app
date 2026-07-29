import {
  normalizeCatalogInputRecord,
  normalizeCatalogOptionalText,
  normalizeCatalogUuid,
} from "../shared/inventoryCatalogValidation";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  InventoryReservationCancellationError,
  type InventoryReservationCancellationInput,
} from "./inventoryReservationCancellation.types";

const MAX_CANCELLATION_REASON_LENGTH = 2_000;

const MAX_CANCELLED_BY_LENGTH = 160;

const DEFAULT_CANCELLED_BY = "system:reservation-cancellation";

function convertValidationError(
  error: unknown,
  code:
    | "INVALID_RESERVATION_ID"
    | "INVALID_REQUEST_BODY"
    | "INVALID_CANCELLATION_REASON"
    | "INVALID_CANCELLED_BY",
): never {
  if (error instanceof InventoryValidationError) {
    throw new InventoryReservationCancellationError(
      code,
      error.message,
      error.errors,
    );
  }

  throw error;
}

function normalizeCancellationRecord(value: unknown) {
  try {
    return normalizeCatalogInputRecord(value);
  } catch (error) {
    convertValidationError(error, "INVALID_REQUEST_BODY");
  }
}

export function normalizeInventoryReservationCancellationId(value: unknown) {
  try {
    return normalizeCatalogUuid(value, "El identificador de la reserva");
  } catch (error) {
    convertValidationError(error, "INVALID_RESERVATION_ID");
  }
}

export function normalizeInventoryReservationCancellationInput(
  value: unknown,
): InventoryReservationCancellationInput {
  const record = normalizeCancellationRecord(value);

  let cancellationReason: string | null | undefined;

  try {
    cancellationReason = normalizeCatalogOptionalText(
      record.cancellation_reason,
      "El motivo de cancelación",
      MAX_CANCELLATION_REASON_LENGTH,
    );
  } catch (error) {
    convertValidationError(error, "INVALID_CANCELLATION_REASON");
  }

  if (!cancellationReason) {
    throw new InventoryReservationCancellationError(
      "INVALID_CANCELLATION_REASON",
      "El motivo de cancelación es obligatorio.",
      {
        cancellation_reason:
          "Ingrese el motivo por el que se cancela la reserva.",
      },
    );
  }

  let cancelledBy: string | null | undefined;

  try {
    cancelledBy = normalizeCatalogOptionalText(
      record.cancelled_by,
      "El usuario que cancela la reserva",
      MAX_CANCELLED_BY_LENGTH,
    );
  } catch (error) {
    convertValidationError(error, "INVALID_CANCELLED_BY");
  }

  return {
    cancellationReason,

    cancelledBy: cancelledBy ?? DEFAULT_CANCELLED_BY,
  };
}
