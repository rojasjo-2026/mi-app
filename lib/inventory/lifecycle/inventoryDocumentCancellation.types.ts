import type { InventoryFieldErrors } from "../shared/inventoryServiceResult.types";

export type InventoryDocumentCancellationOutcome =
  "CANCELLED" | "ALREADY_CANCELLED";

export type InventoryDocumentCancellationTransactionResult = {
  inventoryDocumentId: string;
  outcome: InventoryDocumentCancellationOutcome;
};

export type InventoryDocumentCancellationInput = {
  cancellationReason: string;
};

export type InventoryDocumentCancellationErrorCode =
  | "INVALID_DOCUMENT_ID"
  | "INVALID_REQUEST_BODY"
  | "CANCELLATION_REASON_REQUIRED"
  | "CANCELLATION_REASON_TOO_LONG"
  | "DOCUMENT_NOT_FOUND"
  | "INVALID_DOCUMENT_STATUS";

export class InventoryDocumentCancellationError extends Error {
  readonly code: InventoryDocumentCancellationErrorCode;

  readonly errors: InventoryFieldErrors;

  constructor(
    code: InventoryDocumentCancellationErrorCode,
    message: string,
    errors: InventoryFieldErrors = {},
  ) {
    super(message);

    this.name = "InventoryDocumentCancellationError";
    this.code = code;
    this.errors = errors;
  }
}
