import type { InventoryDocumentDetailResponse } from "../documents/inventoryDocument.types";
import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

export type InventoryDocumentReversalOutcome = "REVERSED" | "ALREADY_REVERSED";

export type InventoryDocumentReversalInput = {
  reversalReason: string;
};

export type InventoryDocumentReversalTransactionResult = {
  originalDocumentId: string;
  reversalDocumentId: string;
  outcome: InventoryDocumentReversalOutcome;
};

export type InventoryDocumentReversalResponse = {
  original_document: InventoryDocumentDetailResponse;
  reversal_document: InventoryDocumentDetailResponse;
};

export type InventoryDocumentReversalErrorCode =
  | "INVALID_DOCUMENT_ID"
  | "INVALID_REQUEST_BODY"
  | "REVERSAL_REASON_REQUIRED"
  | "REVERSAL_REASON_TOO_LONG"
  | "DOCUMENT_NOT_FOUND"
  | "INVALID_DOCUMENT_STATUS"
  | "REVERSAL_DOCUMENT_NOT_ALLOWED"
  | "REVERSAL_STATE_CONFLICT"
  | "DOCUMENT_WITHOUT_LINES"
  | "DOCUMENT_WITHOUT_MOVEMENTS"
  | "MOVEMENT_ALREADY_REVERSED"
  | "INSUFFICIENT_STOCK"
  | "INVALID_STOCK_BALANCE";

export class InventoryDocumentReversalError extends Error {
  readonly code: InventoryDocumentReversalErrorCode;

  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryDocumentReversalErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryDocumentReversalError";
    this.code = code;
    this.errors = errors;
  }
}
