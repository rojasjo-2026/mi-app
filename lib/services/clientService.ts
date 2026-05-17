import { ClientStatus as PrismaClientStatus } from "@prisma/client";

import {
  findClients,
  findClientById,
  createClient,
  updateClient,
  type CreateClientData,
  type UpdateClientData,
} from "@/lib/repositories/clientRepository";
import { validateCreateClient } from "@/lib/validators/clientValidator";
import { toTrimmedStringOrFallback } from "@/lib/utils/string.utils";
import { toNumberOrFallback } from "@/lib/utils/number.utils";
import { normalizeClientStatus } from "@/lib/clients/clientStatus";
import {
  normalizeClientType,
  normalizeComplianceProfile,
  normalizeIdentifier,
  toDateOrNull,
  toNumberOrNull,
  toTrimmedString,
  type ClientComplianceProfile,
  type ClientType,
} from "@/lib/clients/clientNormalizers";
import { resolveClientNames } from "@/lib/clients/clientNameResolver";
import {
  recordClientActivityChangesSafely,
  recordClientCreatedActivitySafely,
} from "@/lib/clients/clientActivityLog.service";

type ClientStatusInput = PrismaClientStatus | string | null;

type CreateClientInput = {
  client_type?: ClientType | string | null;
  compliance_profile?: ClientComplianceProfile | string | null;

  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;

  identification_country?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;

  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
  phone_primary?: string;
  phone_secondary?: string | null;
  email?: string | null;
  country_code?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  address_line?: string | null;
  reference_point?: string | null;
  location_notes?: string | null;
  zone?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  client_status?: ClientStatusInput;
  whatsapp_opt_in?: boolean;
  whatsapp_opt_in_at?: string | Date | null;
  auto_contact_enabled?: boolean;
  maintenance_contact_days_before?: number | null;

  default_payment_term?: "CASH" | "CREDIT";
  default_credit_days?: number | string | null;

  default_discount_rate?: number | string | null;
  billing_same_as_client?: boolean;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  tax_exempt?: boolean;
  preferred_currency?: "CRC" | "USD";

  credit_limit?: number | string | null;

  data_consent_at?: string | Date | null;
  data_consent_source?: string | null;
};

type UpdateClientInput = CreateClientInput;

export async function getClientsService({
  search,
  status,
}: {
  search?: string;
  status?: ClientStatusInput;
}) {
  return findClients({ search, status });
}

export async function getClientByIdService(id: string) {
  return findClientById(id);
}

export async function createClientService(body: CreateClientInput) {
  const errors = validateCreateClient(body);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const countryCode =
    toTrimmedStringOrFallback(body.country_code, "CR") ?? "CR";

  const complianceProfile = normalizeComplianceProfile(
    body.compliance_profile,
    countryCode,
  );

  const names = resolveClientNames(body);

  const identificationCountry =
    toTrimmedStringOrFallback(body.identification_country, countryCode) ??
    countryCode;

  const identificationType =
    toTrimmedString(body.identification_type) ??
    (complianceProfile === "COSTA_RICA" ? "CEDULA_FISICA" : "OTHER");

  const identificationNumber =
    normalizeIdentifier(body.identification_number) ??
    normalizeIdentifier(body.tax_id);

  const paymentTerm = body.default_payment_term ?? "CASH";
  const whatsappOptIn = Boolean(body.whatsapp_opt_in);
  const billingSameAsClient = Boolean(body.billing_same_as_client);

  const email = toTrimmedStringOrFallback(body.email, null);
  const addressLine = toTrimmedStringOrFallback(body.address_line, null);
  const phonePrimary = body.phone_primary!.trim();

  const billingName = billingSameAsClient
    ? names.displayName
    : toTrimmedStringOrFallback(body.billing_name, null);

  const billingEmail = billingSameAsClient
    ? email
    : toTrimmedStringOrFallback(body.billing_email, null);

  const billingPhone = billingSameAsClient
    ? phonePrimary
    : toTrimmedStringOrFallback(body.billing_phone, null);

  const billingAddress = billingSameAsClient
    ? addressLine
    : toTrimmedStringOrFallback(body.billing_address, null);

  const data: CreateClientData = {
    client_type: names.clientType,
    compliance_profile: complianceProfile,

    display_name: names.displayName,
    legal_name: names.legalName,
    company_name: names.companyName,
    commercial_name: names.commercialName,
    main_contact_name: names.mainContactName,

    identification_country: identificationCountry,
    identification_type: identificationType,
    identification_number: identificationNumber,

    first_name: names.firstName,
    last_name_1: names.lastName1,
    last_name_2: names.lastName2,

    phone_primary: phonePrimary,
    phone_secondary: toTrimmedStringOrFallback(body.phone_secondary, null),
    email,

    country_code: countryCode,
    admin_level_1: toTrimmedStringOrFallback(body.admin_level_1, null),
    admin_level_2: toTrimmedStringOrFallback(body.admin_level_2, null),
    admin_level_3: toTrimmedStringOrFallback(body.admin_level_3, null),
    address_line: addressLine,
    reference_point: toTrimmedStringOrFallback(body.reference_point, null),
    location_notes: toTrimmedStringOrFallback(body.location_notes, null),
    zone: toTrimmedStringOrFallback(body.zone, null),
    latitude: toNumberOrFallback(body.latitude, null),
    longitude: toNumberOrFallback(body.longitude, null),

    client_status:
      normalizeClientStatus(body.client_status) ?? PrismaClientStatus.ACTIVE,

    whatsapp_opt_in: whatsappOptIn,
    whatsapp_opt_in_at: whatsappOptIn
      ? (toDateOrNull(body.whatsapp_opt_in_at) ?? new Date())
      : null,

    auto_contact_enabled:
      body.auto_contact_enabled !== undefined
        ? Boolean(body.auto_contact_enabled)
        : true,

    maintenance_contact_days_before:
      body.maintenance_contact_days_before !== undefined
        ? toNumberOrFallback(body.maintenance_contact_days_before, null)
        : null,

    default_payment_term: paymentTerm,
    default_credit_days:
      paymentTerm === "CREDIT"
        ? toNumberOrFallback(body.default_credit_days, null)
        : null,

    default_discount_rate: toNumberOrFallback(body.default_discount_rate, null),
    billing_same_as_client: billingSameAsClient,
    billing_name: billingName,
    billing_email: billingEmail,
    billing_phone: billingPhone,
    billing_address: billingAddress,

    tax_id: identificationNumber,
    tax_exempt: Boolean(body.tax_exempt),
    preferred_currency: body.preferred_currency ?? "CRC",

    credit_limit:
      paymentTerm === "CREDIT"
        ? toNumberOrFallback(body.credit_limit, null)
        : null,

    data_consent_at:
      toDateOrNull(body.data_consent_at) ?? (whatsappOptIn ? new Date() : null),
    data_consent_source:
      toTrimmedStringOrFallback(body.data_consent_source, null) ??
      (whatsappOptIn ? "CLIENT_FORM" : null),
  };

  const client = await createClient(data);

  await recordClientCreatedActivitySafely(client);

  return { success: true, client };
}

export async function updateClientByIdService(
  id: string,
  body: UpdateClientInput,
) {
  const existing = await findClientById(id);

  if (!existing) {
    return null;
  }

  const countryCode =
    body.country_code !== undefined
      ? body.country_code?.trim() || existing.country_code
      : existing.country_code;

  const paymentTerm =
    body.default_payment_term ?? existing.default_payment_term ?? "CASH";

  const nextClientType =
    body.client_type !== undefined
      ? normalizeClientType(body.client_type)
      : existing.client_type;

  const nextComplianceProfile =
    body.compliance_profile !== undefined
      ? normalizeComplianceProfile(body.compliance_profile, countryCode)
      : existing.compliance_profile;

  const nextClientStatus =
    body.client_status !== undefined
      ? (normalizeClientStatus(body.client_status) ??
        normalizeClientStatus(existing.client_status) ??
        PrismaClientStatus.ACTIVE)
      : (normalizeClientStatus(existing.client_status) ??
        PrismaClientStatus.ACTIVE);

  const names = resolveClientNames({
    ...body,
    client_type: nextClientType,
    first_name: body.first_name ?? existing.first_name,
    last_name_1: body.last_name_1 ?? existing.last_name_1,
    last_name_2: body.last_name_2 ?? existing.last_name_2,
    display_name: body.display_name ?? existing.display_name,
    legal_name: body.legal_name ?? existing.legal_name,
    company_name: body.company_name ?? existing.company_name,
    commercial_name: body.commercial_name ?? existing.commercial_name,
    main_contact_name: body.main_contact_name ?? existing.main_contact_name,
  });

  const nextWhatsappOptIn =
    body.whatsapp_opt_in !== undefined
      ? Boolean(body.whatsapp_opt_in)
      : existing.whatsapp_opt_in;

  const nextBillingSameAsClient =
    body.billing_same_as_client !== undefined
      ? Boolean(body.billing_same_as_client)
      : existing.billing_same_as_client;

  const nextEmail =
    body.email !== undefined
      ? toTrimmedStringOrFallback(body.email, null)
      : existing.email;

  const nextAddressLine =
    body.address_line !== undefined
      ? toTrimmedStringOrFallback(body.address_line, null)
      : existing.address_line;

  const nextPhonePrimary =
    body.phone_primary !== undefined
      ? body.phone_primary?.trim() || existing.phone_primary
      : existing.phone_primary;

  const nextIdentificationCountry =
    body.identification_country !== undefined
      ? (toTrimmedStringOrFallback(body.identification_country, countryCode) ??
        countryCode)
      : existing.identification_country;

  const nextIdentificationType =
    body.identification_type !== undefined
      ? toTrimmedStringOrFallback(
          body.identification_type,
          existing.identification_type,
        )
      : existing.identification_type;

  const nextIdentificationNumber =
    body.identification_number !== undefined || body.tax_id !== undefined
      ? (normalizeIdentifier(body.identification_number) ??
        normalizeIdentifier(body.tax_id))
      : existing.identification_number;

  const data: UpdateClientData = {
    client_type: nextClientType,
    compliance_profile: nextComplianceProfile,

    display_name: names.displayName,
    legal_name: names.legalName,
    company_name: names.companyName,
    commercial_name: names.commercialName,
    main_contact_name: names.mainContactName,

    identification_country: nextIdentificationCountry,
    identification_type: nextIdentificationType,
    identification_number: nextIdentificationNumber,

    first_name: names.firstName,
    last_name_1: names.lastName1,
    last_name_2: names.lastName2,

    phone_primary: nextPhonePrimary,

    phone_secondary:
      body.phone_secondary !== undefined
        ? toTrimmedStringOrFallback(body.phone_secondary, null)
        : existing.phone_secondary,

    email: nextEmail,

    country_code: countryCode,

    admin_level_1:
      body.admin_level_1 !== undefined
        ? toTrimmedStringOrFallback(body.admin_level_1, null)
        : existing.admin_level_1,

    admin_level_2:
      body.admin_level_2 !== undefined
        ? toTrimmedStringOrFallback(body.admin_level_2, null)
        : existing.admin_level_2,

    admin_level_3:
      body.admin_level_3 !== undefined
        ? toTrimmedStringOrFallback(body.admin_level_3, null)
        : existing.admin_level_3,

    address_line: nextAddressLine,

    reference_point:
      body.reference_point !== undefined
        ? toTrimmedStringOrFallback(body.reference_point, null)
        : existing.reference_point,

    location_notes:
      body.location_notes !== undefined
        ? toTrimmedStringOrFallback(body.location_notes, null)
        : existing.location_notes,

    zone:
      body.zone !== undefined
        ? toTrimmedStringOrFallback(body.zone, null)
        : existing.zone,

    latitude:
      body.latitude !== undefined
        ? toNumberOrFallback(body.latitude, null)
        : existing.latitude !== null
          ? Number(existing.latitude)
          : null,

    longitude:
      body.longitude !== undefined
        ? toNumberOrFallback(body.longitude, null)
        : existing.longitude !== null
          ? Number(existing.longitude)
          : null,

    client_status: nextClientStatus,

    whatsapp_opt_in: nextWhatsappOptIn,
    whatsapp_opt_in_at:
      body.whatsapp_opt_in !== undefined
        ? nextWhatsappOptIn
          ? (existing.whatsapp_opt_in_at ?? new Date())
          : null
        : existing.whatsapp_opt_in_at,

    auto_contact_enabled:
      body.auto_contact_enabled !== undefined
        ? Boolean(body.auto_contact_enabled)
        : existing.auto_contact_enabled,

    maintenance_contact_days_before:
      body.maintenance_contact_days_before !== undefined
        ? toNumberOrFallback(body.maintenance_contact_days_before, null)
        : existing.maintenance_contact_days_before,

    default_payment_term: paymentTerm,
    default_credit_days:
      paymentTerm === "CREDIT"
        ? body.default_credit_days !== undefined
          ? toNumberOrFallback(body.default_credit_days, null)
          : existing.default_credit_days
        : null,

    default_discount_rate:
      body.default_discount_rate !== undefined
        ? toNumberOrFallback(body.default_discount_rate, null)
        : toNumberOrNull(existing.default_discount_rate),

    billing_same_as_client: nextBillingSameAsClient,

    billing_name: nextBillingSameAsClient
      ? names.displayName
      : body.billing_name !== undefined
        ? toTrimmedStringOrFallback(body.billing_name, null)
        : existing.billing_name,

    billing_email: nextBillingSameAsClient
      ? nextEmail
      : body.billing_email !== undefined
        ? toTrimmedStringOrFallback(body.billing_email, null)
        : existing.billing_email,

    billing_phone: nextBillingSameAsClient
      ? nextPhonePrimary
      : body.billing_phone !== undefined
        ? toTrimmedStringOrFallback(body.billing_phone, null)
        : existing.billing_phone,

    billing_address: nextBillingSameAsClient
      ? nextAddressLine
      : body.billing_address !== undefined
        ? toTrimmedStringOrFallback(body.billing_address, null)
        : existing.billing_address,

    tax_id: nextIdentificationNumber,

    tax_exempt:
      body.tax_exempt !== undefined
        ? Boolean(body.tax_exempt)
        : existing.tax_exempt,

    preferred_currency:
      body.preferred_currency ?? existing.preferred_currency ?? "CRC",

    credit_limit:
      paymentTerm === "CREDIT"
        ? body.credit_limit !== undefined
          ? toNumberOrFallback(body.credit_limit, null)
          : toNumberOrNull(existing.credit_limit)
        : null,

    data_consent_at:
      body.data_consent_at !== undefined
        ? toDateOrNull(body.data_consent_at)
        : existing.data_consent_at,

    data_consent_source:
      body.data_consent_source !== undefined
        ? toTrimmedStringOrFallback(body.data_consent_source, null)
        : existing.data_consent_source,
  };

  const client = await updateClient(id, data);

  await recordClientActivityChangesSafely({
    before: existing,
    after: client,
  });

  return { success: true, client };
}

export async function inactivateClientByIdService(id: string) {
  const existing = await findClientById(id);

  if (!existing) {
    return null;
  }

  const existingStatus =
    normalizeClientStatus(existing.client_status) ?? PrismaClientStatus.ACTIVE;

  if (existingStatus === PrismaClientStatus.INACTIVE) {
    return { success: true, client: existing };
  }

  const client = await updateClient(id, {
    client_status: PrismaClientStatus.INACTIVE,
  });

  await recordClientActivityChangesSafely({
    before: existing,
    after: client,
  });

  return { success: true, client };
}
