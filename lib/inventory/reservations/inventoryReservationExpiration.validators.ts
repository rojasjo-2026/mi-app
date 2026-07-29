import {
  normalizeCatalogInputRecord,
  normalizeCatalogOptionalText,
  normalizeCatalogUuid,
} from "../shared/inventoryCatalogValidation";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  InventoryReservationExpirationError,
  type InventoryReservationExpirationBatchInput,
  type InventoryReservationExpirationInput,
} from "./inventoryReservationExpiration.types";

const DEFAULT_EXPIRATION_REASON = "La reserva alcanzó su fecha de vencimiento.";

const DEFAULT_EXPIRED_BY = "system:reservation-expiration";

const DEFAULT_BATCH_LIMIT = 100;

const MAX_BATCH_LIMIT = 200;

const MAX_REASON_LENGTH = 2_000;

const MAX_USER_LENGTH = 160;

function convertValidationError(
  error: unknown,
  code:
    | "INVALID_RESERVATION_ID"
    | "INVALID_REQUEST_BODY"
    | "INVALID_EXPIRATION_REASON"
    | "INVALID_EXPIRED_BY",
): never {
  if (error instanceof InventoryValidationError) {
    throw new InventoryReservationExpirationError(
      code,
      error.message,
      error.errors,
    );
  }

  throw error;
}

function normalizeExpirationRecord(value: unknown) {
  try {
    return normalizeCatalogInputRecord(value);
  } catch (error) {
    convertValidationError(error, "INVALID_REQUEST_BODY");
  }
}

function normalizeExpirationSettings(
  record: Record<string, unknown>,
): InventoryReservationExpirationInput {
  let expirationReason: string | null | undefined;

  try {
    expirationReason = normalizeCatalogOptionalText(
      record.expiration_reason,
      "El motivo del vencimiento",
      MAX_REASON_LENGTH,
    );
  } catch (error) {
    convertValidationError(error, "INVALID_EXPIRATION_REASON");
  }

  let expiredBy: string | null | undefined;

  try {
    expiredBy = normalizeCatalogOptionalText(
      record.expired_by,
      "El usuario que registra el vencimiento",
      MAX_USER_LENGTH,
    );
  } catch (error) {
    convertValidationError(error, "INVALID_EXPIRED_BY");
  }

  return {
    expirationReason: expirationReason ?? DEFAULT_EXPIRATION_REASON,

    expiredBy: expiredBy ?? DEFAULT_EXPIRED_BY,
  };
}

function normalizeBatchLimit(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_BATCH_LIMIT;
  }

  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isInteger(numericValue) ||
    numericValue < 1 ||
    numericValue > MAX_BATCH_LIMIT
  ) {
    throw new InventoryReservationExpirationError(
      "INVALID_BATCH_LIMIT",
      "El límite del proceso de vencimiento no es válido.",
      {
        limit: `Ingrese un número entero entre 1 y ${MAX_BATCH_LIMIT}.`,
      },
    );
  }

  return numericValue;
}

export function normalizeInventoryReservationExpirationId(value: unknown) {
  try {
    return normalizeCatalogUuid(value, "El identificador de la reserva");
  } catch (error) {
    convertValidationError(error, "INVALID_RESERVATION_ID");
  }
}

export function normalizeInventoryReservationExpirationInput(
  value: unknown,
): InventoryReservationExpirationInput {
  const record = normalizeExpirationRecord(value);

  return normalizeExpirationSettings(record);
}

export function normalizeInventoryReservationExpirationBatchInput(
  value: unknown,
): InventoryReservationExpirationBatchInput {
  const record = normalizeExpirationRecord(value);

  return {
    ...normalizeExpirationSettings(record),

    limit: normalizeBatchLimit(record.limit),
  };
}
