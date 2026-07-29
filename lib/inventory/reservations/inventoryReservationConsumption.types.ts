import type { InventoryReservationStatus } from "@prisma/client";

import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

import type { InventoryReservationDetailResponse } from "./inventoryReservation.types";

export type InventoryReservationConsumptionLineInput = {
  inventoryReservationLineId: string;
  quantity: string;
};

export type InventoryReservationConsumptionInput = {
  idempotencyKey: string;
  consumptionReason: string;
  consumedBy: string | null;
  lines: InventoryReservationConsumptionLineInput[];
};

export type InventoryReservationConsumptionOutcome =
  "CONSUMED" | "ALREADY_CONSUMED";

export type InventoryReservationConsumptionTransactionResult = {
  inventoryReservationId: string;
  inventoryDocumentId: string;
  reservationStatus: InventoryReservationStatus;
  outcome: InventoryReservationConsumptionOutcome;
};

export type InventoryReservationConsumptionResponse = {
  inventory_document_id: string;
  outcome: InventoryReservationConsumptionOutcome;
  reservation: InventoryReservationDetailResponse;
};

export type InventoryReservationConsumptionErrorCode =
  | "INVALID_RESERVATION_ID"
  | "INVALID_REQUEST_BODY"
  | "INVALID_IDEMPOTENCY_KEY"
  | "INVALID_CONSUMPTION_REASON"
  | "INVALID_CONSUMED_BY"
  | "INVALID_LINES"
  | "INVALID_LINE_ID"
  | "INVALID_QUANTITY"
  | "RESERVATION_NOT_FOUND"
  | "RESERVATION_EXPIRED"
  | "INVALID_RESERVATION_STATUS"
  | "RESERVATION_LINE_NOT_FOUND"
  | "MULTIPLE_SOURCE_LOCATIONS"
  | "INVALID_LINE_STATE"
  | "QUANTITY_EXCEEDS_RESERVED"
  | "INVALID_UNIT_QUANTITY"
  | "STOCK_BALANCE_NOT_FOUND"
  | "STOCK_BALANCE_MISMATCH"
  | "IDEMPOTENCY_KEY_CONFLICT"
  | "TRANSACTION_CONFLICT";

export class InventoryReservationConsumptionError extends Error {
  readonly code: InventoryReservationConsumptionErrorCode;
  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryReservationConsumptionErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryReservationConsumptionError";

    this.code = code;

    this.errors = errors;
  }
}
