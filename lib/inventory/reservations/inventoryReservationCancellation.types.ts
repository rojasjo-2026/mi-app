import type { InventoryReservationStatus } from "@prisma/client";

import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

import type { InventoryReservationDetailResponse } from "./inventoryReservation.types";

export type InventoryReservationCancellationInput = {
  cancellationReason: string;
  cancelledBy: string | null;
};

export type InventoryReservationCancellationOutcome =
  "CANCELLED" | "ALREADY_CANCELLED";

export type InventoryReservationCancellationTransactionResult = {
  inventoryReservationId: string;
  reservationStatus: InventoryReservationStatus;
  outcome: InventoryReservationCancellationOutcome;
};

export type InventoryReservationCancellationResponse = {
  outcome: InventoryReservationCancellationOutcome;
  reservation: InventoryReservationDetailResponse;
};

export type InventoryReservationCancellationErrorCode =
  | "INVALID_RESERVATION_ID"
  | "INVALID_REQUEST_BODY"
  | "INVALID_CANCELLATION_REASON"
  | "INVALID_CANCELLED_BY"
  | "RESERVATION_NOT_FOUND"
  | "INVALID_RESERVATION_STATUS"
  | "INVALID_LINE_STATE"
  | "TRANSACTION_CONFLICT";

export class InventoryReservationCancellationError extends Error {
  readonly code: InventoryReservationCancellationErrorCode;

  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryReservationCancellationErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryReservationCancellationError";

    this.code = code;

    this.errors = errors;
  }
}
