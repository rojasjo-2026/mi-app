import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

export type InventoryTransferOperation = "DISPATCH" | "RECEIVE";

export type InventoryTransferOutcome =
  "DISPATCHED" | "ALREADY_DISPATCHED" | "RECEIVED" | "ALREADY_RECEIVED";

export type InventoryTransferTransactionResult = {
  inventoryDocumentId: string;
  outcome: InventoryTransferOutcome;
};

export type InventoryTransferErrorCode =
  | "INVALID_DOCUMENT_ID"
  | "DOCUMENT_NOT_FOUND"
  | "NOT_TRANSFER"
  | "INVALID_DOCUMENT_STATUS"
  | "EMPTY_DOCUMENT"
  | "SOURCE_LOCATION_REQUIRED"
  | "DESTINATION_LOCATION_REQUIRED"
  | "SAME_LOCATION"
  | "SOURCE_LOCATION_INACTIVE"
  | "DESTINATION_LOCATION_INACTIVE"
  | "SOURCE_LOCATION_STOCK_DISABLED"
  | "DESTINATION_LOCATION_STOCK_DISABLED"
  | "PRODUCT_INACTIVE"
  | "PRODUCT_STOCK_DISABLED"
  | "VARIANT_INACTIVE"
  | "STOCK_UNIT_INACTIVE"
  | "INVALID_LINE_QUANTITY"
  | "INSUFFICIENT_STOCK";

export class InventoryTransferError extends Error {
  readonly code: InventoryTransferErrorCode;

  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryTransferErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryTransferError";
    this.code = code;
    this.errors = errors;
  }
}
