export const INSTALLATION_REPORT_COLUMNS = [
  "installation_id",
  "client_name",
  "service_type",
  "installation_date",
  "installation_status",
  "is_active",
  "billing_status",
  "estimated_amount",
  "final_amount",
  "cost_amount",
  "pending_billing",
  "warranty_months",
  "warranty_end_date",
  "technician_name",
  "address_line",
  "city",
  "admin_level_1",
  "admin_level_2",
  "admin_level_3",
  "zone",
  "operational_zone",
  "components_count",
  "follow_ups_count",
  "pending_follow_up_date",
  "invoices_count",
  "description",
  "technical_observations",
  "reference_point",
  "location_notes",
  "created_at",
  "updated_at",
] as const;

export type InstallationReportColumnKey =
  (typeof INSTALLATION_REPORT_COLUMNS)[number];

export const DEFAULT_COLUMNS = [
  "client_name",
  "service_type",
  "installation_date",
  "installation_status",
  "billing_status",
  "technician_name",
  "admin_level_1",
  "admin_level_2",
  "pending_billing",
] as const satisfies readonly InstallationReportColumnKey[];

export const ALLOWED_COLUMNS = new Set<InstallationReportColumnKey>(
  INSTALLATION_REPORT_COLUMNS,
);

export const VALID_INSTALLATION_STATUSES = new Set([
  "OPEN",
  "IN_PROGRESS",
  "CLOSED",
  "CANCELLED",
]);

export const VALID_BILLING_STATUSES = new Set([
  "PENDING",
  "INVOICED",
  "PARTIALLY_PAID",
  "PAID",
  "NOT_BILLABLE",
  "BILLING_ERROR",
  "CANCELLED",
]);

export const PENDING_INVOICE_STATUSES = [
  "PENDING",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;
