import type { InventoryReservationStatus } from "@prisma/client";

import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

import type { InventoryReservationDetailResponse } from "./inventoryReservation.types";

export type InventoryReservationExpirationInput = {
  expirationReason: string;
  expiredBy: string | null;
};

export type InventoryReservationExpirationBatchInput =
  InventoryReservationExpirationInput & {
    limit: number;
  };

export type InventoryReservationExpirationOutcome =
  "EXPIRED" | "ALREADY_EXPIRED";

export type InventoryReservationExpirationTransactionResult = {
  inventoryReservationId: string;
  reservationStatus: InventoryReservationStatus;
  outcome: InventoryReservationExpirationOutcome;
  quantityReleased: string;
};

export type InventoryReservationExpirationResponse = {
  outcome: InventoryReservationExpirationOutcome;
  quantity_released: string;
  reservation: InventoryReservationDetailResponse;
};

export type InventoryReservationExpirationBatchItemOutcome =
  InventoryReservationExpirationOutcome | "FAILED";

export type InventoryReservationExpirationBatchItem = {
  inventory_reservation_id: string;
  outcome: InventoryReservationExpirationBatchItemOutcome;
  quantity_released: string | null;
  error_code: InventoryReservationExpirationErrorCode | null;
  message: string;
};

export type InventoryReservationExpirationBatchResponse = {
  as_of: string;
  matched: number;
  expired: number;
  already_expired: number;
  failed: number;
  items: InventoryReservationExpirationBatchItem[];
};

export type InventoryReservationExpirationErrorCode =
  | "INVALID_RESERVATION_ID"
  | "INVALID_REQUEST_BODY"
  | "INVALID_EXPIRATION_REASON"
  | "INVALID_EXPIRED_BY"
  | "INVALID_BATCH_LIMIT"
  | "RESERVATION_NOT_FOUND"
  | "EXPIRATION_DATE_REQUIRED"
  | "RESERVATION_NOT_DUE"
  | "INVALID_RESERVATION_STATUS"
  | "INVALID_LINE_STATE"
  | "NO_RESERVED_QUANTITY"
  | "STOCK_BALANCE_NOT_FOUND"
  | "STOCK_BALANCE_MISMATCH"
  | "TRANSACTION_CONFLICT";

export class InventoryReservationExpirationError extends Error {
  readonly code: InventoryReservationExpirationErrorCode;
  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryReservationExpirationErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryReservationExpirationError";

    this.code = code;

    this.errors = errors;
  }
}
