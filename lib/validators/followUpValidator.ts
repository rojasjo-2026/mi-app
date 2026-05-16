type ValidationError = {
  field: string;
  error: string;
};

type CreateFollowUpInput = {
  client_id?: string;
  installation_id?: string | null;
  target_date?: string;
  due_date?: string | null;
  priority?: number | string | null;
};

/**
 * Validates input payload for follow-up creation.
 * Only enforces required fields and basic type constraints.
 */
export function validateCreateFollowUp(
  body: CreateFollowUpInput,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.client_id || !String(body.client_id).trim()) {
    errors.push({ field: "client_id", error: "required" });
  }

  if (!body.target_date || !String(body.target_date).trim()) {
    errors.push({ field: "target_date", error: "required" });
  } else {
    const parsedTargetDate = new Date(body.target_date);

    if (Number.isNaN(parsedTargetDate.getTime())) {
      errors.push({ field: "target_date", error: "invalid" });
    }
  }

  if (
    body.due_date !== undefined &&
    body.due_date !== null &&
    body.due_date !== ""
  ) {
    const parsedDueDate = new Date(body.due_date);

    if (Number.isNaN(parsedDueDate.getTime())) {
      errors.push({ field: "due_date", error: "invalid" });
    }
  }

  if (
    body.priority !== undefined &&
    body.priority !== null &&
    body.priority !== ""
  ) {
    const parsedPriority = Number(body.priority);

    if (Number.isNaN(parsedPriority)) {
      errors.push({ field: "priority", error: "invalid" });
    }
  }

  return errors;
}
