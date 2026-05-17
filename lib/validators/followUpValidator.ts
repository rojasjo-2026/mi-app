import { WorkBillingStatus } from "@prisma/client";

type ValidationError = {
  field: string;
  error: string;
};

type CreateFollowUpInput = {
  client_id?: string;
  installation_id?: string | null;
  target_date?: string | Date;
  due_date?: string | Date | null;
  priority?: number | string | null;

  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  maintenance_type?: string | null;
  technician_id?: string | null;
};

function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

function isInvalidDate(value: unknown) {
  if (isBlank(value)) return false;

  const parsedDate = new Date(value as string | Date);

  return Number.isNaN(parsedDate.getTime());
}

function isInvalidNumber(value: unknown) {
  if (isBlank(value)) return false;

  return !Number.isFinite(Number(value));
}

function isNegativeNumber(value: unknown) {
  if (isBlank(value)) return false;

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue < 0;
}

function isInvalidInteger(value: unknown) {
  if (isBlank(value)) return false;

  return !Number.isInteger(Number(value));
}

function isInvalidPriority(value: unknown) {
  if (isBlank(value)) return false;

  const parsedPriority = Number(value);

  return (
    !Number.isInteger(parsedPriority) ||
    parsedPriority < 1 ||
    parsedPriority > 3
  );
}

function isInvalidBillingStatus(value: unknown) {
  if (isBlank(value)) return false;

  const normalizedValue = String(value).trim().toUpperCase();

  return !Object.values(WorkBillingStatus).includes(
    normalizedValue as WorkBillingStatus,
  );
}

function validateOptionalAmount(
  errors: ValidationError[],
  field: keyof CreateFollowUpInput,
  value: unknown,
) {
  if (isInvalidNumber(value)) {
    errors.push({ field, error: "invalid" });
    return;
  }

  if (isNegativeNumber(value)) {
    errors.push({ field, error: "must_be_zero_or_greater" });
  }
}

/**
 * Validates input payload for follow-up creation.
 * Enforces required fields and basic business constraints.
 */
export function validateCreateFollowUp(
  body: CreateFollowUpInput,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isBlank(body.client_id)) {
    errors.push({ field: "client_id", error: "required" });
  }

  if (isBlank(body.target_date)) {
    errors.push({ field: "target_date", error: "required" });
  } else if (isInvalidDate(body.target_date)) {
    errors.push({ field: "target_date", error: "invalid" });
  }

  if (isInvalidDate(body.due_date)) {
    errors.push({ field: "due_date", error: "invalid" });
  }

  if (isInvalidPriority(body.priority)) {
    errors.push({ field: "priority", error: "must_be_1_2_or_3" });
  } else if (isInvalidInteger(body.priority)) {
    errors.push({ field: "priority", error: "must_be_integer" });
  } else if (isInvalidNumber(body.priority)) {
    errors.push({ field: "priority", error: "invalid" });
  }

  validateOptionalAmount(errors, "estimated_amount", body.estimated_amount);
  validateOptionalAmount(errors, "final_amount", body.final_amount);
  validateOptionalAmount(errors, "cost_amount", body.cost_amount);

  if (isInvalidBillingStatus(body.billing_status)) {
    errors.push({ field: "billing_status", error: "invalid" });
  }

  return errors;
}
