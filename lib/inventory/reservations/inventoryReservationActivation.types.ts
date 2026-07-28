import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

export type InventoryReservationActivationOutcome =
  "ACTIVATED" | "ALREADY_ACTIVE";

export type InventoryReservationActivationTransactionResult = {
  inventoryReservationId: string;
  outcome: InventoryReservationActivationOutcome;
};

export type InventoryReservationActivationErrorCode =
  | "INVALID_RESERVATION_ID"
  | "RESERVATION_NOT_FOUND"
  | "INVALID_RESERVATION_STATUS"
  | "RESERVATION_EXPIRED"
  | "EMPTY_RESERVATION"
  | "INVALID_LINE_STATE"
  | "INVALID_LINE_QUANTITY"
  | "VARIANT_INACTIVE"
  | "PRODUCT_INACTIVE"
  | "PRODUCT_STOCK_DISABLED"
  | "LOCATION_INACTIVE"
  | "LOCATION_STOCK_DISABLED"
  | "INSUFFICIENT_STOCK"
  | "TRANSACTION_CONFLICT";

export class InventoryReservationActivationError extends Error {
  readonly code: InventoryReservationActivationErrorCode;
  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryReservationActivationErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryReservationActivationError";
    this.code = code;
    this.errors = errors;
  }
}
