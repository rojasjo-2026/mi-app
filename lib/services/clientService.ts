import {
  ClientStatus as PrismaClientStatus,
  type ActivityLogAction,
  type ActivityLogCategory,
  type ActivityLogVisibility,
  type Prisma,
} from "@prisma/client";

import {
  findClients,
  findClientById,
  createClient,
  updateClient,
  type CreateClientData,
  type UpdateClientData,
} from "@/lib/repositories/clientRepository";
import {
  createActivityLog,
  createManyActivityLogs,
} from "@/lib/repositories/activityLogRepository";
import { validateCreateClient } from "@/lib/validators/clientValidator";
import { toTrimmedStringOrFallback } from "@/lib/utils/string.utils";
import { toNumberOrFallback } from "@/lib/utils/number.utils";
import { normalizeClientStatus } from "@/lib/clients/clientStatus";

type ClientType = "PERSON" | "COMPANY" | "OTHER";
type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";
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

type ActivitySourceRecord = Record<string, unknown>;

type ClientActivityField = {
  fieldName: string;
  title: string;
  description: string;
  category: ActivityLogCategory;
  visibility: ActivityLogVisibility;
  action: ActivityLogAction;
};

const CLIENT_ACTIVITY_FIELDS: ClientActivityField[] = [
  {
    fieldName: "client_type",
    title: "Tipo de cliente actualizado",
    description: "Se actualizó el tipo de cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "compliance_profile",
    title: "Perfil de cumplimiento actualizado",
    description: "Se actualizó el perfil de cumplimiento del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "display_name",
    title: "Nombre visible actualizado",
    description: "Se actualizó el nombre visible del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "legal_name",
    title: "Nombre legal actualizado",
    description: "Se actualizó el nombre legal del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "company_name",
    title: "Nombre de empresa actualizado",
    description: "Se actualizó el nombre de empresa del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "commercial_name",
    title: "Nombre comercial actualizado",
    description: "Se actualizó el nombre comercial del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "main_contact_name",
    title: "Contacto principal actualizado",
    description: "Se actualizó el contacto principal del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "identification_country",
    title: "País de identificación actualizado",
    description: "Se actualizó el país de identificación del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "identification_type",
    title: "Tipo de identificación actualizado",
    description: "Se actualizó el tipo de identificación del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "identification_number",
    title: "Número de identificación actualizado",
    description: "Se actualizó el número de identificación del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "first_name",
    title: "Nombre actualizado",
    description: "Se actualizó el nombre del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "last_name_1",
    title: "Primer apellido actualizado",
    description: "Se actualizó el primer apellido del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "last_name_2",
    title: "Segundo apellido actualizado",
    description: "Se actualizó el segundo apellido del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "phone_primary",
    title: "Teléfono principal actualizado",
    description: "Se actualizó el teléfono principal del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "phone_secondary",
    title: "Teléfono secundario actualizado",
    description: "Se actualizó el teléfono secundario del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "email",
    title: "Correo electrónico actualizado",
    description: "Se actualizó el correo electrónico del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "country_code",
    title: "País actualizado",
    description: "Se actualizó el país del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "admin_level_1",
    title: "Provincia actualizada",
    description: "Se actualizó la provincia del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "admin_level_2",
    title: "Cantón actualizado",
    description: "Se actualizó el cantón del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "admin_level_3",
    title: "Distrito actualizado",
    description: "Se actualizó el distrito del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "address_line",
    title: "Dirección actualizada",
    description: "Se actualizó la dirección del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "reference_point",
    title: "Punto de referencia actualizado",
    description: "Se actualizó el punto de referencia del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "location_notes",
    title: "Notas de ubicación actualizadas",
    description: "Se actualizaron las notas de ubicación del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "zone",
    title: "Zona actualizada",
    description: "Se actualizó la zona del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "latitude",
    title: "Latitud actualizada",
    description: "Se actualizó la latitud del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "longitude",
    title: "Longitud actualizada",
    description: "Se actualizó la longitud del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "client_status",
    title: "Estado del cliente actualizado",
    description: "Se actualizó el estado del cliente.",
    category: "CLIENT",
    visibility: "PUBLIC_INTERNAL",
    action: "STATUS_CHANGED",
  },
  {
    fieldName: "whatsapp_opt_in",
    title: "Preferencia de WhatsApp actualizada",
    description: "Se actualizó la preferencia de contacto por WhatsApp.",
    category: "CONTACT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "whatsapp_opt_in_at",
    title: "Fecha de autorización de WhatsApp actualizada",
    description:
      "Se actualizó la fecha de autorización de contacto por WhatsApp.",
    category: "CONTACT",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "default_payment_term",
    title: "Condición de pago actualizada",
    description: "Se actualizó la condición de pago del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "default_credit_days",
    title: "Días de crédito actualizados",
    description: "Se actualizaron los días de crédito del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "default_discount_rate",
    title: "Descuento predeterminado actualizado",
    description: "Se actualizó el descuento predeterminado del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "billing_same_as_client",
    title: "Configuración de facturación actualizada",
    description:
      "Se actualizó la configuración para usar los mismos datos del cliente en facturación.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "billing_name",
    title: "Nombre de facturación actualizado",
    description: "Se actualizó el nombre de facturación del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "billing_email",
    title: "Correo de facturación actualizado",
    description: "Se actualizó el correo de facturación del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "billing_phone",
    title: "Teléfono de facturación actualizado",
    description: "Se actualizó el teléfono de facturación del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "billing_address",
    title: "Dirección de facturación actualizada",
    description: "Se actualizó la dirección de facturación del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "tax_id",
    title: "Identificación tributaria actualizada",
    description: "Se actualizó la identificación tributaria del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "tax_exempt",
    title: "Exoneración actualizada",
    description: "Se actualizó la configuración de exoneración del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "preferred_currency",
    title: "Moneda preferida actualizada",
    description: "Se actualizó la moneda preferida del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "credit_limit",
    title: "Límite de crédito actualizado",
    description: "Se actualizó el límite de crédito del cliente.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "data_consent_at",
    title: "Consentimiento de datos actualizado",
    description:
      "Se actualizó la fecha de consentimiento para tratamiento de datos.",
    category: "SYSTEM",
    visibility: "ADMIN_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "data_consent_source",
    title: "Origen del consentimiento actualizado",
    description:
      "Se actualizó el origen del consentimiento para tratamiento de datos.",
    category: "SYSTEM",
    visibility: "ADMIN_ONLY",
    action: "UPDATED",
  },
];

function toActivityValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    const textValue = String(value).trim();
    return textValue || null;
  }

  if (typeof value === "object" && "toString" in value) {
    const textValue = String(value).trim();

    if (textValue && textValue !== "[object Object]") {
      return textValue;
    }
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeForComparison(value: unknown) {
  return toActivityValue(value) ?? "";
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeIdentifier(value: unknown): string | null {
  const textValue = toTrimmedString(value);

  if (!textValue) {
    return null;
  }

  return textValue.replace(/[\s-]/g, "") || null;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function normalizeClientType(value: unknown): ClientType {
  const textValue = toTrimmedString(value)?.toUpperCase();

  if (textValue === "COMPANY" || textValue === "OTHER") {
    return textValue;
  }

  return "PERSON";
}

function normalizeComplianceProfile(
  value: unknown,
  countryCode: string,
): ClientComplianceProfile {
  const textValue = toTrimmedString(value)?.toUpperCase();

  if (textValue === "GLOBAL" || textValue === "COSTA_RICA") {
    return textValue;
  }

  return countryCode === "CR" ? "COSTA_RICA" : "GLOBAL";
}

function buildPersonDisplayName(params: {
  firstName: string | null;
  lastName1: string | null;
  lastName2: string | null;
}) {
  return [params.firstName, params.lastName1, params.lastName2]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function resolveClientNames(body: CreateClientInput) {
  const clientType = normalizeClientType(body.client_type);

  const firstName = toTrimmedString(body.first_name);
  const lastName1 = toTrimmedString(body.last_name_1);
  const lastName2 = toTrimmedString(body.last_name_2);

  const companyName = toTrimmedString(body.company_name);
  const commercialName = toTrimmedString(body.commercial_name);
  const legalNameInput = toTrimmedString(body.legal_name);
  const displayNameInput = toTrimmedString(body.display_name);
  const mainContactName = toTrimmedString(body.main_contact_name);

  if (clientType === "COMPANY") {
    const resolvedCompanyName =
      companyName ?? legalNameInput ?? displayNameInput ?? "Empresa";

    return {
      clientType,
      firstName: resolvedCompanyName,
      lastName1: "Empresa",
      lastName2: null,
      displayName: displayNameInput ?? resolvedCompanyName,
      legalName: legalNameInput ?? resolvedCompanyName,
      companyName: resolvedCompanyName,
      commercialName,
      mainContactName,
    };
  }

  if (clientType === "OTHER") {
    const resolvedName =
      displayNameInput ?? legalNameInput ?? firstName ?? "Cliente";

    return {
      clientType,
      firstName: resolvedName,
      lastName1: "Otro",
      lastName2: null,
      displayName: resolvedName,
      legalName: legalNameInput ?? resolvedName,
      companyName: companyName,
      commercialName,
      mainContactName,
    };
  }

  const personDisplayName =
    displayNameInput ||
    buildPersonDisplayName({
      firstName,
      lastName1,
      lastName2,
    });

  return {
    clientType,
    firstName: firstName ?? "",
    lastName1: lastName1 ?? "",
    lastName2,
    displayName: personDisplayName,
    legalName: legalNameInput ?? personDisplayName,
    companyName,
    commercialName,
    mainContactName,
  };
}

async function recordClientCreatedActivitySafely(client: unknown) {
  try {
    const record = client as ActivitySourceRecord;
    const clientId = toActivityValue(record.client_id);

    if (!clientId) {
      return null;
    }

    return createActivityLog({
      client_id: clientId,
      entity_type: "CLIENT",
      entity_id: clientId,
      category: "CLIENT",
      action: "CREATED",
      visibility: "PUBLIC_INTERNAL",
      title: "Cliente creado",
      description: "Se creó el cliente en el sistema.",
      created_by: null,
    });
  } catch (error) {
    console.error("Error recording client created activity:", error);
    return null;
  }
}

async function recordClientActivityChangesSafely(params: {
  before: unknown;
  after: unknown;
}) {
  try {
    const beforeRecord = params.before as ActivitySourceRecord | null;
    const afterRecord = params.after as ActivitySourceRecord | null;

    const clientId = toActivityValue(
      afterRecord?.client_id ?? beforeRecord?.client_id,
    );

    if (!clientId) {
      return { count: 0 };
    }

    const logs: Prisma.ActivityLogCreateManyInput[] = [];

    for (const field of CLIENT_ACTIVITY_FIELDS) {
      const oldRawValue = beforeRecord?.[field.fieldName] ?? null;
      const newRawValue = afterRecord?.[field.fieldName] ?? null;

      if (
        normalizeForComparison(oldRawValue) ===
        normalizeForComparison(newRawValue)
      ) {
        continue;
      }

      logs.push({
        client_id: clientId,
        entity_type: "CLIENT",
        entity_id: clientId,
        category: field.category,
        action: field.action,
        visibility: field.visibility,
        field_name: field.fieldName,
        old_value: toActivityValue(oldRawValue),
        new_value: toActivityValue(newRawValue),
        title: field.title,
        description: field.description,
        created_by: null,
      });
    }

    return createManyActivityLogs(logs);
  } catch (error) {
    console.error("Error recording client activity changes:", error);
    return { count: 0 };
  }
}

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
