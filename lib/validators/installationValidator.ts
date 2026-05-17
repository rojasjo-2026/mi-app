import { InstallationStatus, WorkBillingStatus } from "@prisma/client";

type ValidationError = {
  field: string;
  error: string;
};

type CreateOrUpdateInstallationInput = {
  client_id?: string;
  service_type_id?: number | string;
  installation_date?: string | Date;

  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  cost_amount?: number | string | null;
  warranty_months?: number | string | null;

  latitude?: number | string | null;
  longitude?: number | string | null;

  installation_status?: string | null;
  billing_status?: string | null;
};

function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
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

  const parsedValue = Number(value);

  return !Number.isInteger(parsedValue);
}

function isInvalidLatitude(value: unknown) {
  if (isBlank(value)) return false;

  const parsedValue = Number(value);

  return !Number.isFinite(parsedValue) || parsedValue < -90 || parsedValue > 90;
}

function isInvalidLongitude(value: unknown) {
  if (isBlank(value)) return false;

  const parsedValue = Number(value);

  return (
    !Number.isFinite(parsedValue) || parsedValue < -180 || parsedValue > 180
  );
}

function isInvalidInstallationStatus(value: unknown) {
  if (isBlank(value)) return false;

  const normalizedValue = String(value).trim().toUpperCase();

  return !Object.values(InstallationStatus).includes(
    normalizedValue as InstallationStatus,
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
  field: keyof CreateOrUpdateInstallationInput,
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

export function validateInstallationInput(
  body: CreateOrUpdateInstallationInput,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isBlank(body.client_id)) {
    errors.push({ field: "client_id", error: "required" });
  }

  if (isBlank(body.service_type_id)) {
    errors.push({ field: "service_type_id", error: "required" });
  } else if (isInvalidNumber(body.service_type_id)) {
    errors.push({ field: "service_type_id", error: "invalid" });
  }

  if (isBlank(body.installation_date)) {
    errors.push({ field: "installation_date", error: "required" });
  } else {
    const parsedDate = new Date(body.installation_date as string | Date);

    if (Number.isNaN(parsedDate.getTime())) {
      errors.push({ field: "installation_date", error: "invalid" });
    }
  }

  validateOptionalAmount(errors, "estimated_amount", body.estimated_amount);
  validateOptionalAmount(errors, "final_amount", body.final_amount);
  validateOptionalAmount(errors, "cost_amount", body.cost_amount);

  if (isInvalidNumber(body.warranty_months)) {
    errors.push({ field: "warranty_months", error: "invalid" });
  } else if (isInvalidInteger(body.warranty_months)) {
    errors.push({ field: "warranty_months", error: "must_be_integer" });
  } else if (isNegativeNumber(body.warranty_months)) {
    errors.push({ field: "warranty_months", error: "must_be_zero_or_greater" });
  }

  if (isInvalidLatitude(body.latitude)) {
    errors.push({ field: "latitude", error: "invalid_range" });
  }

  if (isInvalidLongitude(body.longitude)) {
    errors.push({ field: "longitude", error: "invalid_range" });
  }

  if (isInvalidInstallationStatus(body.installation_status)) {
    errors.push({ field: "installation_status", error: "invalid" });
  }

  if (isInvalidBillingStatus(body.billing_status)) {
    errors.push({ field: "billing_status", error: "invalid" });
  }

  return errors;
}
