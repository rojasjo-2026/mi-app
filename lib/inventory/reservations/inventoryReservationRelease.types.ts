import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

export type InventoryReservationReleaseInput = {
  releaseReason: string;
  releasedBy: string | null;
};

export type InventoryReservationReleaseOutcome =
  "RELEASED" | "ALREADY_RELEASED";

export type InventoryReservationReleaseTransactionResult = {
  inventoryReservationId: string;
  outcome: InventoryReservationReleaseOutcome;
};

export type InventoryReservationReleaseErrorCode =
  | "INVALID_RESERVATION_ID"
  | "INVALID_REQUEST_BODY"
  | "RELEASE_REASON_REQUIRED"
  | "RELEASE_REASON_TOO_LONG"
  | "INVALID_RELEASED_BY"
  | "RELEASED_BY_TOO_LONG"
  | "RESERVATION_NOT_FOUND"
  | "INVALID_RESERVATION_STATUS"
  | "EMPTY_RESERVATION"
  | "INVALID_LINE_STATE"
  | "NO_RESERVED_QUANTITY"
  | "BALANCE_NOT_FOUND"
  | "RESERVED_BALANCE_MISMATCH"
  | "TRANSACTION_CONFLICT";

export class InventoryReservationReleaseError extends Error {
  readonly code: InventoryReservationReleaseErrorCode;
  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryReservationReleaseErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryReservationReleaseError";
    this.code = code;
    this.errors = errors;
  }
}
