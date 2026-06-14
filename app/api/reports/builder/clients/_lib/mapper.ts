import type { Prisma } from "@prisma/client";
import {
  PENDING_INVOICE_STATUSES,
  type ClientReportColumnKey,
} from "./constants";
import type { ClientReportRow } from "./types";
import { formatDate, getClientName, toNumber } from "./utils";

export const CLIENT_REPORT_SELECT = {
  client_id: true,
  client_type: true,
  display_name: true,
  company_name: true,
  commercial_name: true,
  first_name: true,
  last_name_1: true,
  last_name_2: true,
  phone_primary: true,
  phone_secondary: true,
  email: true,
  client_status: true,
  whatsapp_opt_in: true,
  auto_contact_enabled: true,
  country_code: true,
  admin_level_1: true,
  admin_level_2: true,
  admin_level_3: true,
  address_line: true,
  zone: true,
  tax_id: true,
  identification_type: true,
  identification_number: true,
  default_payment_term: true,
  default_credit_days: true,
  preferred_currency: true,
  tax_exempt: true,
  billing_name: true,
  billing_email: true,
  billing_phone: true,
  billing_address: true,
  created_at: true,
  updated_at: true,
  operational_zone: {
    select: {
      name: true,
    },
  },
  invoices: {
    where: {
      status: {
        in: [...PENDING_INVOICE_STATUSES],
      },
    },
    select: {
      balance_amount: true,
    },
  },
  _count: {
    select: {
      installations: true,
      follow_ups: true,
      contact_attempts: true,
      invoices: true,
    },
  },
} satisfies Prisma.ClientSelect;

type ClientReportClient = Prisma.ClientGetPayload<{
  select: typeof CLIENT_REPORT_SELECT;
}>;

export function mapClientToReportRow(
  client: ClientReportClient,
  columns: ClientReportColumnKey[],
): ClientReportRow {
  const pendingBillingAmount = client.invoices.reduce(
    (total, invoice) => total + toNumber(invoice.balance_amount),
    0,
  );

  const fullRow: Record<ClientReportColumnKey, string | number> = {
    client_name: getClientName(client),
    client_type: client.client_type,
    phone_primary: client.phone_primary,
    phone_secondary: client.phone_secondary ?? "",
    email: client.email ?? "",
    client_status: client.client_status,
    whatsapp_opt_in: client.whatsapp_opt_in ? "Sí" : "No",
    auto_contact_enabled: client.auto_contact_enabled ? "Sí" : "No",
    country_code: client.country_code,
    admin_level_1: client.admin_level_1 ?? "",
    admin_level_2: client.admin_level_2 ?? "",
    admin_level_3: client.admin_level_3 ?? "",
    operational_zone: client.operational_zone?.name ?? "",
    zone: client.operational_zone?.name || client.zone || "",
    address_line: client.address_line ?? "",
    tax_id: client.tax_id ?? "",
    identification_type: client.identification_type ?? "",
    identification_number: client.identification_number ?? "",
    default_payment_term: client.default_payment_term,
    default_credit_days: client.default_credit_days ?? "",
    preferred_currency: client.preferred_currency,
    tax_exempt: client.tax_exempt ? "Sí" : "No",
    billing_name: client.billing_name ?? "",
    billing_email: client.billing_email ?? "",
    billing_phone: client.billing_phone ?? "",
    billing_address: client.billing_address ?? "",
    installations_count: client._count.installations,
    follow_ups_count: client._count.follow_ups,
    contact_attempts_count: client._count.contact_attempts,
    invoices_count: client._count.invoices,
    pending_billing: pendingBillingAmount,
    created_at: formatDate(client.created_at),
    updated_at: formatDate(client.updated_at),
  };

  return columns.reduce<ClientReportRow>((row, columnKey) => {
    row[columnKey] = fullRow[columnKey] ?? "";
    return row;
  }, {});
}
