export const CLIENT_REPORT_COLUMNS = [
  "client_name",
  "client_type",
  "phone_primary",
  "phone_secondary",
  "email",
  "client_status",
  "whatsapp_opt_in",
  "auto_contact_enabled",
  "country_code",
  "admin_level_1",
  "admin_level_2",
  "admin_level_3",
  "operational_zone",
  "zone",
  "address_line",
  "tax_id",
  "identification_type",
  "identification_number",
  "default_payment_term",
  "default_credit_days",
  "preferred_currency",
  "tax_exempt",
  "billing_name",
  "billing_email",
  "billing_phone",
  "billing_address",
  "installations_count",
  "follow_ups_count",
  "contact_attempts_count",
  "invoices_count",
  "pending_billing",
  "created_at",
  "updated_at",
] as const;

export type ClientReportColumnKey = (typeof CLIENT_REPORT_COLUMNS)[number];

export const DEFAULT_COLUMNS = [
  "client_name",
  "phone_primary",
  "email",
  "client_status",
  "whatsapp_opt_in",
  "admin_level_1",
  "admin_level_2",
] as const satisfies readonly ClientReportColumnKey[];

export const ALLOWED_COLUMNS = new Set<ClientReportColumnKey>(
  CLIENT_REPORT_COLUMNS,
);

export const VALID_CLIENT_TYPES = new Set(["PERSON", "COMPANY", "OTHER"]);

export const VALID_CLIENT_STATUSES = new Set([
  "ACTIVE",
  "PROSPECT",
  "ON_HOLD",
  "INACTIVE",
]);

export const VALID_PAYMENT_TERMS = new Set(["CASH", "CREDIT"]);

export const VALID_CURRENCIES = new Set([
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

export const PENDING_INVOICE_STATUSES = [
  "PENDING",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;
