import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

export type InventoryDocumentPostingDirection = "INBOUND" | "OUTBOUND";

export type InventoryDocumentPostingOutcome = "POSTED" | "ALREADY_POSTED";

export type InventoryDocumentPostingTransactionResult = {
  inventoryDocumentId: string;
  outcome: InventoryDocumentPostingOutcome;
};

export type InventoryDocumentPostingErrorCode =
  | "INVALID_DOCUMENT_ID"
  | "DOCUMENT_NOT_FOUND"
  | "INVALID_DOCUMENT_STATUS"
  | "TRANSFER_NOT_SUPPORTED"
  | "EMPTY_DOCUMENT"
  | "LOCATION_REQUIRED"
  | "LOCATION_INACTIVE"
  | "LOCATION_STOCK_DISABLED"
  | "PRODUCT_INACTIVE"
  | "PRODUCT_STOCK_DISABLED"
  | "VARIANT_INACTIVE"
  | "STOCK_UNIT_INACTIVE"
  | "INVALID_LINE_QUANTITY"
  | "INSUFFICIENT_STOCK";

export class InventoryDocumentPostingError extends Error {
  readonly code: InventoryDocumentPostingErrorCode;
  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryDocumentPostingErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryDocumentPostingError";
    this.code = code;
    this.errors = errors;
  }
}
