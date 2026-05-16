type ValidationError = {
  field: string;
  error: string;
};

type CreateContactAttemptInput = {
  client_id?: string;
  contact_channel_id?: number | string;
  contact_result_id?: number | string;
  attempt_datetime?: string;
  next_target_date?: string | null;
};

export function validateCreateContactAttempt(
  body: CreateContactAttemptInput,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.client_id || !String(body.client_id).trim()) {
    errors.push({ field: "client_id", error: "required" });
  }

  if (
    body.contact_channel_id === undefined ||
    body.contact_channel_id === null ||
    String(body.contact_channel_id).trim() === ""
  ) {
    errors.push({ field: "contact_channel_id", error: "required" });
  } else if (Number.isNaN(Number(body.contact_channel_id))) {
    errors.push({ field: "contact_channel_id", error: "invalid" });
  }

  if (
    body.contact_result_id === undefined ||
    body.contact_result_id === null ||
    String(body.contact_result_id).trim() === ""
  ) {
    errors.push({ field: "contact_result_id", error: "required" });
  } else if (Number.isNaN(Number(body.contact_result_id))) {
    errors.push({ field: "contact_result_id", error: "invalid" });
  }

  if (!body.attempt_datetime || !String(body.attempt_datetime).trim()) {
    errors.push({ field: "attempt_datetime", error: "required" });
  } else {
    const parsedAttemptDate = new Date(body.attempt_datetime);

    if (Number.isNaN(parsedAttemptDate.getTime())) {
      errors.push({ field: "attempt_datetime", error: "invalid" });
    }
  }

  if (
    body.next_target_date !== undefined &&
    body.next_target_date !== null &&
    body.next_target_date !== ""
  ) {
    const parsedNextTargetDate = new Date(body.next_target_date);

    if (Number.isNaN(parsedNextTargetDate.getTime())) {
      errors.push({ field: "next_target_date", error: "invalid" });
    }
  }

  return errors;
}
