type ValidationError = {
  field: string;
  error: string;
};

type CreateOrUpdateInstallationInput = {
  client_id?: string;
  service_type_id?: number | string;
  installation_date?: string;
};

export function validateInstallationInput(
  body: CreateOrUpdateInstallationInput,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.client_id || !String(body.client_id).trim()) {
    errors.push({ field: "client_id", error: "required" });
  }

  if (
    body.service_type_id === undefined ||
    body.service_type_id === null ||
    String(body.service_type_id).trim() === ""
  ) {
    errors.push({ field: "service_type_id", error: "required" });
  } else if (Number.isNaN(Number(body.service_type_id))) {
    errors.push({ field: "service_type_id", error: "invalid" });
  }

  if (!body.installation_date || !String(body.installation_date).trim()) {
    errors.push({ field: "installation_date", error: "required" });
  } else {
    const parsedDate = new Date(body.installation_date);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push({ field: "installation_date", error: "invalid" });
    }
  }

  return errors;
}
