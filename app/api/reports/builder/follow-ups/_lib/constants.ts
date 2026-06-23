export const FOLLOW_UP_REPORT_COLUMNS = [
  "follow_up_id",
  "client_name",
  "installation_reference",
  "installation_service_type",
  "follow_up_status",
  "target_date",
  "due_date",
  "scheduled_date",
  "completed_at",
  "is_completed",
  "priority",
  "maintenance_type",
  "technician_name",
  "created_from",
  "billing_status",
  "estimated_amount",
  "final_amount",
  "cost_amount",
  "pending_billing",
  "contact_attempts_count",
  "contact_flows_count",
  "follow_up_notes_count",
  "invoices_count",
  "operational_zone",
  "reason",
  "notes",
  "billing_notes",
  "billing_block_reason",
  "created_at",
  "updated_at",
] as const;

export type FollowUpReportColumnKey = (typeof FOLLOW_UP_REPORT_COLUMNS)[number];

export const DEFAULT_COLUMNS = [
  "client_name",
  "installation_reference",
  "follow_up_status",
  "target_date",
  "due_date",
  "scheduled_date",
  "is_completed",
  "technician_name",
  "pending_billing",
] as const satisfies readonly FollowUpReportColumnKey[];

export const ALLOWED_COLUMNS = new Set<FollowUpReportColumnKey>(
  FOLLOW_UP_REPORT_COLUMNS,
);

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

export const ACTIVE_CONTACT_FLOW_STATUSES = [
  "PENDING",
  "MESSAGE_SENT",
  "WAITING_RESPONSE",
  "OPTIONS_SENT",
  "DATE_SELECTED",
  "CONFIRMED",
  "MANUAL_REQUIRED",
  "NO_RESPONSE",
  "REJECTED",
] as const;
