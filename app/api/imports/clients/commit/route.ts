import { NextResponse, type NextRequest } from "next/server";
import type {
  ClientStatus,
  ClientType,
  CurrencyCode,
  InvoicePaymentTerm,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RawClientImportRow = Record<string, string | number | boolean | null>;

type ImportDetail = {
  rowNumber: number;
  status: "created" | "skipped" | "error";
  clientName: string;
  message: string;
};

const MAX_IMPORT_ROWS = 500;

const VALID_CLIENT_TYPES = new Set(["PERSON", "COMPANY", "OTHER"]);

const VALID_CLIENT_STATUSES = new Set([
  "ACTIVE",
  "PROSPECT",
  "ON_HOLD",
  "INACTIVE",
]);

const VALID_PAYMENT_TERMS = new Set(["CASH", "CREDIT"]);

const VALID_CURRENCIES = new Set([
  "ARS",
  "BOB",
  "BRL",
  "CAD",
  "CLP",
  "COP",
  "CRC",
  "DOP",
  "EUR",
  "GTQ",
  "HNL",
  "MXN",
  "NIO",
  "PEN",
  "PYG",
  "USD",
  "UYU",
  "VES",
  "XAF",
]);

function getString(row: RawClientImportRow, key: string) {
  const value = row[key];

  if (value === null || value === undefined) return "";

  return String(value).trim();
}

function emptyToNull(value: string) {
  return value.trim() ? value.trim() : null;
}

function normalizeUpper(value: string) {
  return value.trim().toUpperCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function parseBoolean(value: string, fallback: boolean) {
  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "y", "si", "sí", "s"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseOptionalInt(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) return null;

  return parsed;
}

function getClientDisplayName(row: RawClientImportRow) {
  const clientType = normalizeUpper(getString(row, "client_type") || "PERSON");
  const firstName = getString(row, "first_name");
  const lastName1 = getString(row, "last_name_1");
  const lastName2 = getString(row, "last_name_2");
  const companyName = getString(row, "company_name");
  const commercialName = getString(row, "commercial_name");

  if (clientType === "COMPANY") {
    return commercialName || companyName || "Empresa sin nombre";
  }

  return [firstName, lastName1, lastName2].filter(Boolean).join(" ").trim();
}

function getIdentificationKey(row: RawClientImportRow) {
  const identificationCountry =
    normalizeUpper(getString(row, "identification_country")) ||
    normalizeUpper(getString(row, "country_code")) ||
    "CR";

  const identificationType = normalizeUpper(
    getString(row, "identification_type"),
  );

  const identificationNumber = getString(row, "identification_number");

  if (!identificationType || !identificationNumber) return "";

  return `${identificationCountry}|${identificationType}|${identificationNumber}`;
}

function validateRow(row: RawClientImportRow) {
  const errors: string[] = [];

  const clientType = normalizeUpper(getString(row, "client_type") || "PERSON");
  const firstName = getString(row, "first_name");
  const lastName1 = getString(row, "last_name_1");
  const companyName = getString(row, "company_name");
  const phonePrimary = getString(row, "phone_primary");
  const email = getString(row, "email");
  const clientStatus = normalizeUpper(
    getString(row, "client_status") || "ACTIVE",
  );
  const paymentTerm = normalizeUpper(
    getString(row, "default_payment_term") || "CASH",
  );
  const currency = normalizeUpper(
    getString(row, "preferred_currency") || "CRC",
  );

  if (!VALID_CLIENT_TYPES.has(clientType)) {
    errors.push("client_type no es válido");
  }

  if (!phonePrimary) {
    errors.push("phone_primary es requerido");
  }

  if (clientType === "COMPANY" && !companyName) {
    errors.push("company_name es requerido para empresas");
  }

  if (clientType !== "COMPANY" && (!firstName || !lastName1)) {
    errors.push("first_name y last_name_1 son requeridos para personas");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("email no tiene formato válido");
  }

  if (!VALID_CLIENT_STATUSES.has(clientStatus)) {
    errors.push("client_status no es válido");
  }

  if (!VALID_PAYMENT_TERMS.has(paymentTerm)) {
    errors.push("default_payment_term no es válido");
  }

  if (!VALID_CURRENCIES.has(currency)) {
    errors.push("preferred_currency no es válida");
  }

  return errors;
}

function buildDuplicateMaps(rows: RawClientImportRow[]) {
  const phones = new Map<string, number>();
  const emails = new Map<string, number>();
  const taxIds = new Map<string, number>();
  const identifications = new Map<string, number>();

  for (const row of rows) {
    const phone = getString(row, "phone_primary");
    const email = normalizeEmail(getString(row, "email"));
    const taxId = getString(row, "tax_id");
    const identificationKey = getIdentificationKey(row);

    if (phone) phones.set(phone, (phones.get(phone) ?? 0) + 1);
    if (email) emails.set(email, (emails.get(email) ?? 0) + 1);
    if (taxId) taxIds.set(taxId, (taxIds.get(taxId) ?? 0) + 1);
    if (identificationKey) {
      identifications.set(
        identificationKey,
        (identifications.get(identificationKey) ?? 0) + 1,
      );
    }
  }

  return {
    phones,
    emails,
    taxIds,
    identifications,
  };
}

function getInFileDuplicateErrors(
  row: RawClientImportRow,
  duplicateMaps: ReturnType<typeof buildDuplicateMaps>,
) {
  const errors: string[] = [];

  const phone = getString(row, "phone_primary");
  const email = normalizeEmail(getString(row, "email"));
  const taxId = getString(row, "tax_id");
  const identificationKey = getIdentificationKey(row);

  if (phone && (duplicateMaps.phones.get(phone) ?? 0) > 1) {
    errors.push("phone_primary está duplicado en el archivo");
  }

  if (email && (duplicateMaps.emails.get(email) ?? 0) > 1) {
    errors.push("email está duplicado en el archivo");
  }

  if (taxId && (duplicateMaps.taxIds.get(taxId) ?? 0) > 1) {
    errors.push("tax_id está duplicado en el archivo");
  }

  if (
    identificationKey &&
    (duplicateMaps.identifications.get(identificationKey) ?? 0) > 1
  ) {
    errors.push("identificación está duplicada en el archivo");
  }

  return errors;
}

async function getExistingDuplicateKeys(rows: RawClientImportRow[]) {
  const phones = Array.from(
    new Set(rows.map((row) => getString(row, "phone_primary")).filter(Boolean)),
  );

  const emails = Array.from(
    new Set(
      rows
        .map((row) => normalizeEmail(getString(row, "email")))
        .filter(Boolean),
    ),
  );

  const taxIds = Array.from(
    new Set(rows.map((row) => getString(row, "tax_id")).filter(Boolean)),
  );

  const identificationFilters = rows
    .map((row) => {
      const identificationCountry =
        normalizeUpper(getString(row, "identification_country")) ||
        normalizeUpper(getString(row, "country_code")) ||
        "CR";

      const identificationType = normalizeUpper(
        getString(row, "identification_type"),
      );

      const identificationNumber = getString(row, "identification_number");

      if (!identificationType || !identificationNumber) return null;

      return {
        identification_country: identificationCountry,
        identification_type: identificationType,
        identification_number: identificationNumber,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const orFilters: Prisma.ClientWhereInput[] = [];

  if (phones.length > 0) {
    orFilters.push({
      phone_primary: {
        in: phones,
      },
    });
  }

  if (emails.length > 0) {
    orFilters.push({
      email: {
        in: emails,
      },
    });
  }

  if (taxIds.length > 0) {
    orFilters.push({
      tax_id: {
        in: taxIds,
      },
    });
  }

  for (const identification of identificationFilters) {
    orFilters.push(identification);
  }

  if (orFilters.length === 0) {
    return {
      phones: new Set<string>(),
      emails: new Set<string>(),
      taxIds: new Set<string>(),
      identifications: new Set<string>(),
    };
  }

  const existingClients = await prisma.client.findMany({
    where: {
      OR: orFilters,
    },
    select: {
      phone_primary: true,
      email: true,
      tax_id: true,
      identification_country: true,
      identification_type: true,
      identification_number: true,
    },
  });

  return {
    phones: new Set(existingClients.map((client) => client.phone_primary)),
    emails: new Set(
      existingClients
        .map((client) => client.email?.toLowerCase().trim())
        .filter((email): email is string => Boolean(email)),
    ),
    taxIds: new Set(
      existingClients
        .map((client) => client.tax_id?.trim())
        .filter((taxId): taxId is string => Boolean(taxId)),
    ),
    identifications: new Set(
      existingClients
        .map((client) => {
          if (!client.identification_type || !client.identification_number) {
            return "";
          }

          return `${client.identification_country}|${client.identification_type}|${client.identification_number}`;
        })
        .filter(Boolean),
    ),
  };
}

function getDatabaseDuplicateErrors(
  row: RawClientImportRow,
  existingKeys: Awaited<ReturnType<typeof getExistingDuplicateKeys>>,
) {
  const errors: string[] = [];

  const phone = getString(row, "phone_primary");
  const email = normalizeEmail(getString(row, "email"));
  const taxId = getString(row, "tax_id");
  const identificationKey = getIdentificationKey(row);

  if (phone && existingKeys.phones.has(phone)) {
    errors.push("Ya existe un cliente con ese teléfono");
  }

  if (email && existingKeys.emails.has(email)) {
    errors.push("Ya existe un cliente con ese email");
  }

  if (taxId && existingKeys.taxIds.has(taxId)) {
    errors.push("Ya existe un cliente con ese tax_id");
  }

  if (
    identificationKey &&
    existingKeys.identifications.has(identificationKey)
  ) {
    errors.push("Ya existe un cliente con esa identificación");
  }

  return errors;
}

function buildClientData(row: RawClientImportRow): Prisma.ClientCreateInput {
  const clientType = normalizeUpper(
    getString(row, "client_type") || "PERSON",
  ) as ClientType;

  const companyName = getString(row, "company_name");
  const commercialName = getString(row, "commercial_name");
  const firstName = getString(row, "first_name");
  const lastName1 = getString(row, "last_name_1");
  const lastName2 = getString(row, "last_name_2");
  const mainContactName = getString(row, "main_contact_name");
  const displayName = getClientDisplayName(row);

  const phonePrimary = getString(row, "phone_primary");
  const phoneSecondary = getString(row, "phone_secondary");
  const email = normalizeEmail(getString(row, "email"));
  const countryCode = normalizeUpper(getString(row, "country_code") || "CR");

  const billingName = getString(row, "billing_name");
  const billingEmail = normalizeEmail(getString(row, "billing_email"));
  const billingPhone = getString(row, "billing_phone");
  const billingAddress = getString(row, "billing_address");

  const hasBillingData = Boolean(
    billingName || billingEmail || billingPhone || billingAddress,
  );

  const identificationCountry =
    normalizeUpper(getString(row, "identification_country")) || countryCode;

  return {
    client_type: clientType,
    display_name: displayName,
    legal_name: emptyToNull(getString(row, "legal_name")),

    first_name:
      clientType === "COMPANY"
        ? firstName || mainContactName || companyName || displayName
        : firstName,
    last_name_1: clientType === "COMPANY" ? lastName1 || "-" : lastName1,
    last_name_2: emptyToNull(lastName2),

    company_name: emptyToNull(companyName),
    commercial_name: emptyToNull(commercialName),
    main_contact_name: emptyToNull(mainContactName),

    phone_primary: phonePrimary,
    phone_secondary: emptyToNull(phoneSecondary),
    email: emptyToNull(email),

    country_code: countryCode,
    admin_level_1: emptyToNull(getString(row, "admin_level_1")),
    admin_level_2: emptyToNull(getString(row, "admin_level_2")),
    admin_level_3: emptyToNull(getString(row, "admin_level_3")),

    address_line: emptyToNull(getString(row, "address_line")),
    reference_point: emptyToNull(getString(row, "reference_point")),
    location_notes: emptyToNull(getString(row, "location_notes")),
    zone: emptyToNull(getString(row, "zone")),

    client_status: normalizeUpper(
      getString(row, "client_status") || "ACTIVE",
    ) as ClientStatus,

    whatsapp_opt_in: parseBoolean(getString(row, "whatsapp_opt_in"), false),
    whatsapp_opt_in_at: parseBoolean(getString(row, "whatsapp_opt_in"), false)
      ? new Date()
      : null,
    auto_contact_enabled: parseBoolean(
      getString(row, "auto_contact_enabled"),
      true,
    ),
    maintenance_contact_days_before: parseOptionalInt(
      getString(row, "maintenance_contact_days_before"),
    ),

    default_payment_term: normalizeUpper(
      getString(row, "default_payment_term") || "CASH",
    ) as InvoicePaymentTerm,
    default_credit_days: parseOptionalInt(
      getString(row, "default_credit_days"),
    ),

    billing_same_as_client: !hasBillingData,
    billing_name: emptyToNull(billingName),
    billing_email: emptyToNull(billingEmail),
    billing_phone: emptyToNull(billingPhone),
    billing_address: emptyToNull(billingAddress),

    tax_id: emptyToNull(getString(row, "tax_id")),
    identification_country: identificationCountry,
    identification_type: emptyToNull(
      normalizeUpper(getString(row, "identification_type")),
    ),
    identification_number: emptyToNull(getString(row, "identification_number")),

    tax_exempt: parseBoolean(getString(row, "tax_exempt"), false),
    preferred_currency: normalizeUpper(
      getString(row, "preferred_currency") || "CRC",
    ) as CurrencyCode,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      rows?: RawClientImportRow[];
    };

    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No se recibieron filas para importar",
        },
        { status: 400 },
      );
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        {
          success: false,
          message: `La importación permite máximo ${MAX_IMPORT_ROWS} filas por ejecución`,
        },
        { status: 400 },
      );
    }

    const duplicateMaps = buildDuplicateMaps(rows);
    const existingKeys = await getExistingDuplicateKeys(rows);

    const details: ImportDetail[] = [];
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    await prisma.$transaction(async (transaction) => {
      for (const row of rows) {
        const rowNumber = Number(getString(row, "__rowNumber") || 0);
        const clientName = getClientDisplayName(row) || "Cliente sin nombre";

        const errors = [
          ...validateRow(row),
          ...getInFileDuplicateErrors(row, duplicateMaps),
          ...getDatabaseDuplicateErrors(row, existingKeys),
        ];

        if (errors.length > 0) {
          skippedCount += 1;

          details.push({
            rowNumber,
            status: "skipped",
            clientName,
            message: errors.join("; "),
          });

          continue;
        }

        try {
          const client = await transaction.client.create({
            data: buildClientData(row),
            select: {
              client_id: true,
              display_name: true,
              first_name: true,
              last_name_1: true,
              company_name: true,
            },
          });

          await transaction.activityLog.create({
            data: {
              client_id: client.client_id,
              entity_type: "CLIENT",
              entity_id: client.client_id,
              category: "CLIENT",
              action: "CREATED",
              visibility: "PUBLIC_INTERNAL",
              title: "Cliente importado desde Excel",
              description: `Cliente ${client.display_name || client.company_name || `${client.first_name} ${client.last_name_1}`} creado desde el módulo de importación.`,
              metadata: {
                source: "reports_client_import",
                rowNumber,
              },
              created_by: "system",
            },
          });

          createdCount += 1;

          details.push({
            rowNumber,
            status: "created",
            clientName,
            message: "Cliente creado correctamente",
          });
        } catch (error) {
          console.error("Error creating imported client:", error);

          errorCount += 1;

          details.push({
            rowNumber,
            status: "error",
            clientName,
            message: "No se pudo crear el cliente",
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      createdCount,
      skippedCount,
      errorCount,
      details,
    });
  } catch (error) {
    console.error("Error importing clients:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo completar la importación de clientes",
      },
      { status: 500 },
    );
  }
}
