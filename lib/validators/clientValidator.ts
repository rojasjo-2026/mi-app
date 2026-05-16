import {
  CLIENT_STATUSES,
  normalizeClientStatus,
  type ClientStatus,
} from "@/lib/clients/clientStatus";

type ValidationError = {
  field: string;
  error: string;
};

type ClientType = "PERSON" | "COMPANY" | "OTHER";
type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

type CreateClientInput = {
  client_type?: ClientType | string | null;
  compliance_profile?: ClientComplianceProfile | string | null;
  client_status?: ClientStatus | string | null;

  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;

  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;

  identification_country?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;
  tax_id?: string | null;

  phone_primary?: string | null;

  default_payment_term?: "CASH" | "CREDIT";
  default_credit_days?: number | string | null;
};

const VALID_CLIENT_TYPES: ClientType[] = ["PERSON", "COMPANY", "OTHER"];

const VALID_COMPLIANCE_PROFILES: ClientComplianceProfile[] = [
  "GLOBAL",
  "COSTA_RICA",
];

const COSTA_RICA_IDENTIFICATION_TYPES = [
  "CEDULA_FISICA",
  "CEDULA_JURIDICA",
  "DIMEX",
  "NITE",
  "EXTRANJERO_NO_DOMICILIADO",
  "NO_CONTRIBUYENTE",
  "OTHER",
];

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUpperText(value: unknown): string {
  return normalizeText(value).toUpperCase();
}

function normalizeIdentifier(value: unknown): string {
  return normalizeText(value).replace(/[\s-]/g, "");
}

function hasText(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

function hasValidPhone(value: unknown): boolean {
  const digits = normalizeText(value).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 20;
}

function isPositiveInteger(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0;
}

function validateCostaRicaIdentification(params: {
  identificationType: string;
  identificationNumber: string;
  errors: ValidationError[];
}) {
  const { identificationType, identificationNumber, errors } = params;

  if (!COSTA_RICA_IDENTIFICATION_TYPES.includes(identificationType)) {
    errors.push({
      field: "identification_type",
      error: "invalid_costa_rica_identification_type",
    });
    return;
  }

  if (
    identificationType === "CEDULA_FISICA" &&
    !/^\d{9}$/.test(identificationNumber)
  ) {
    errors.push({
      field: "identification_number",
      error: "cedula_fisica_must_have_9_digits",
    });
  }

  if (
    identificationType === "CEDULA_JURIDICA" &&
    !/^\d{10}$/.test(identificationNumber)
  ) {
    errors.push({
      field: "identification_number",
      error: "cedula_juridica_must_have_10_digits",
    });
  }

  if (
    identificationType === "DIMEX" &&
    !/^[1-9]\d{10,11}$/.test(identificationNumber)
  ) {
    errors.push({
      field: "identification_number",
      error: "dimex_must_have_11_or_12_digits_without_leading_zero",
    });
  }

  if (identificationType === "NITE" && !/^\d{10}$/.test(identificationNumber)) {
    errors.push({
      field: "identification_number",
      error: "nite_must_have_10_digits",
    });
  }

  if (
    ["EXTRANJERO_NO_DOMICILIADO", "NO_CONTRIBUYENTE", "OTHER"].includes(
      identificationType,
    ) &&
    identificationNumber.length > 20
  ) {
    errors.push({
      field: "identification_number",
      error: "identification_number_max_20_characters",
    });
  }
}

export function validateCreateClient(
  body: CreateClientInput,
): ValidationError[] {
  const errors: ValidationError[] = [];

  const clientType = normalizeUpperText(
    body.client_type || "PERSON",
  ) as ClientType;

  const complianceProfile = normalizeUpperText(
    body.compliance_profile || "COSTA_RICA",
  ) as ClientComplianceProfile;

  const clientStatus = normalizeClientStatus(body.client_status);

  const identificationType = normalizeText(body.identification_type);
  const identificationNumber = normalizeIdentifier(
    body.identification_number || body.tax_id,
  );

  if (!VALID_CLIENT_TYPES.includes(clientType)) {
    errors.push({ field: "client_type", error: "invalid" });
  }

  if (!VALID_COMPLIANCE_PROFILES.includes(complianceProfile)) {
    errors.push({ field: "compliance_profile", error: "invalid" });
  }

  if (
    body.client_status !== undefined &&
    body.client_status !== null &&
    body.client_status !== "" &&
    (!clientStatus || !CLIENT_STATUSES.includes(clientStatus))
  ) {
    errors.push({ field: "client_status", error: "invalid" });
  }

  if (clientType === "PERSON") {
    if (!hasText(body.first_name)) {
      errors.push({ field: "first_name", error: "required" });
    }

    if (!hasText(body.last_name_1)) {
      errors.push({ field: "last_name_1", error: "required" });
    }
  }

  if (clientType === "COMPANY") {
    if (
      !hasText(body.company_name) &&
      !hasText(body.legal_name) &&
      !hasText(body.display_name)
    ) {
      errors.push({ field: "company_name", error: "required" });
    }
  }

  if (clientType === "OTHER") {
    if (
      !hasText(body.display_name) &&
      !hasText(body.legal_name) &&
      !hasText(body.first_name)
    ) {
      errors.push({ field: "display_name", error: "required" });
    }
  }

  if (!identificationType) {
    errors.push({ field: "identification_type", error: "required" });
  }

  if (!identificationNumber) {
    errors.push({ field: "identification_number", error: "required" });
  }

  if (
    complianceProfile === "COSTA_RICA" &&
    identificationType &&
    identificationNumber
  ) {
    validateCostaRicaIdentification({
      identificationType,
      identificationNumber,
      errors,
    });
  }

  if (!body.phone_primary || !body.phone_primary.trim()) {
    errors.push({ field: "phone_primary", error: "required" });
  } else if (!hasValidPhone(body.phone_primary)) {
    errors.push({
      field: "phone_primary",
      error: "phone_must_have_between_8_and_20_digits",
    });
  }

  if (
    body.default_payment_term === "CREDIT" &&
    !isPositiveInteger(body.default_credit_days)
  ) {
    errors.push({
      field: "default_credit_days",
      error: "required_when_payment_term_is_credit",
    });
  }

  return errors;
}
