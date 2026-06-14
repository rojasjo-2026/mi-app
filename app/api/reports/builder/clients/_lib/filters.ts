import type { NextRequest } from "next/server";
import type {
  ClientStatus,
  ClientType,
  CurrencyCode,
  InvoicePaymentTerm,
  Prisma,
} from "@prisma/client";
import {
  PENDING_INVOICE_STATUSES,
  VALID_CLIENT_STATUSES,
  VALID_CLIENT_TYPES,
  VALID_CURRENCIES,
  VALID_PAYMENT_TERMS,
} from "./constants";
import type { ClientReportRequest } from "./types";
import {
  applyDateRange,
  isUuid,
  parseBooleanFilter,
  parsePositiveInt,
  sanitizeColumns,
} from "./utils";

export function parseClientReportRequest(
  request: NextRequest,
): ClientReportRequest {
  const { searchParams } = new URL(request.url);

  const page = parsePositiveInt(searchParams.get("page"), 1, 100000);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 25, 1000);

  const search = searchParams.get("search")?.trim() ?? "";
  const clientType = searchParams.get("clientType") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const whatsapp = searchParams.get("whatsapp") ?? "all";
  const autoContact = searchParams.get("autoContact") ?? "all";
  const taxExempt = searchParams.get("taxExempt") ?? "all";
  const installationStatus = searchParams.get("installationStatus") ?? "all";
  const pendingBilling = searchParams.get("pendingBilling") ?? "all";
  const countryCode = searchParams.get("countryCode") ?? "all";
  const adminLevel1 = searchParams.get("adminLevel1") ?? "all";
  const adminLevel2 = searchParams.get("adminLevel2") ?? "all";
  const adminLevel3 = searchParams.get("adminLevel3") ?? "all";
  const operationalZoneId = searchParams.get("operationalZoneId") ?? "all";
  const paymentTerm = searchParams.get("paymentTerm") ?? "all";
  const preferredCurrency = searchParams.get("preferredCurrency") ?? "all";

  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const updatedFrom = searchParams.get("updatedFrom");
  const updatedTo = searchParams.get("updatedTo");

  const columns = sanitizeColumns(searchParams.get("columns"));

  const where: Prisma.ClientWhereInput = {};

  if (search) {
    where.OR = [
      { display_name: { contains: search, mode: "insensitive" } },
      { first_name: { contains: search, mode: "insensitive" } },
      { last_name_1: { contains: search, mode: "insensitive" } },
      { last_name_2: { contains: search, mode: "insensitive" } },
      { company_name: { contains: search, mode: "insensitive" } },
      { commercial_name: { contains: search, mode: "insensitive" } },
      { phone_primary: { contains: search, mode: "insensitive" } },
      { phone_secondary: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { tax_id: { contains: search, mode: "insensitive" } },
      {
        identification_number: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (VALID_CLIENT_TYPES.has(clientType)) {
    where.client_type = clientType as ClientType;
  }

  if (VALID_CLIENT_STATUSES.has(status)) {
    where.client_status = status as ClientStatus;
  }

  const whatsappValue = parseBooleanFilter(whatsapp);
  if (whatsappValue !== null) {
    where.whatsapp_opt_in = whatsappValue;
  }

  const autoContactValue = parseBooleanFilter(autoContact);
  if (autoContactValue !== null) {
    where.auto_contact_enabled = autoContactValue;
  }

  const taxExemptValue = parseBooleanFilter(taxExempt);
  if (taxExemptValue !== null) {
    where.tax_exempt = taxExemptValue;
  }

  if (installationStatus === "with") {
    where.installations = {
      some: {},
    };
  }

  if (installationStatus === "without") {
    where.installations = {
      none: {},
    };
  }

  if (pendingBilling === "with") {
    where.invoices = {
      some: {
        status: {
          in: [...PENDING_INVOICE_STATUSES],
        },
        balance_amount: {
          gt: 0,
        },
      },
    };
  }

  if (pendingBilling === "without") {
    where.invoices = {
      none: {
        status: {
          in: [...PENDING_INVOICE_STATUSES],
        },
        balance_amount: {
          gt: 0,
        },
      },
    };
  }

  if (countryCode !== "all" && countryCode.trim()) {
    where.country_code = countryCode;
  }

  if (adminLevel1 !== "all" && adminLevel1.trim()) {
    where.admin_level_1 = adminLevel1;
  }

  if (adminLevel2 !== "all" && adminLevel2.trim()) {
    where.admin_level_2 = adminLevel2;
  }

  if (adminLevel3 !== "all" && adminLevel3.trim()) {
    where.admin_level_3 = adminLevel3;
  }

  if (operationalZoneId === "without") {
    where.operational_zone_id = null;
  } else if (operationalZoneId !== "all" && isUuid(operationalZoneId)) {
    where.operational_zone_id = operationalZoneId;
  }

  if (VALID_PAYMENT_TERMS.has(paymentTerm)) {
    where.default_payment_term = paymentTerm as InvoicePaymentTerm;
  }

  if (VALID_CURRENCIES.has(preferredCurrency)) {
    where.preferred_currency = preferredCurrency as CurrencyCode;
  }

  applyDateRange(where, "created_at", createdFrom, createdTo);
  applyDateRange(where, "updated_at", updatedFrom, updatedTo);

  return {
    page,
    pageSize,
    columns,
    where,
  };
}
