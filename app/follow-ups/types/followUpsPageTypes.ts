export type Technician = {
  user_id?: string;
  full_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
    default_currency?: string | null;
  } | null;
};

export type FollowUp = {
  follow_up_id: string;
  client_id: string;
  installation_id: string | null;
  target_date: string;
  scheduled_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  reason: string | null;
  priority: number | null;
  maintenance_type?: string | null;
  estimated_amount?: unknown;
  final_amount?: unknown;
  cost_amount?: unknown;
  billing_status?: string | null;
  billing_notes?: string | null;
  technician_id?: string | null;
  technician?: Technician | null;
  follow_up_status?: {
    code: string;
    name: string;
  };
  client?: {
    client_id?: string;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
  } | null;
  installation?: {
    installation_id?: string;
    description?: string | null;
    installation_date?: string | null;
  } | null;
};

export type FollowUpFilter = "all" | "pending" | "completed" | "postponed";

export type TimingFilter = "all" | "overdue" | "today" | "upcoming";

export type PriorityFilter = "all" | "1" | "2" | "3";

export type BillingFilter =
  | "all"
  | "PENDING"
  | "INVOICED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "NOT_BILLABLE"
  | "BILLING_ERROR"
  | "CANCELLED";

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type FollowUpMetrics = {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  today: number;
  pendingBilling: number;
};

export type SortKey =
  | "maintenance"
  | "client"
  | "installation"
  | "targetDate"
  | "scheduledDate"
  | "technician"
  | "priority"
  | "amount"
  | "billing"
  | "status";

export type SortDirection = "asc" | "desc";

export type ColumnKey =
  | "maintenance"
  | "client"
  | "installation"
  | "targetDate"
  | "scheduledDate"
  | "technician"
  | "priority"
  | "amount"
  | "billing"
  | "status"
  | "actions";

export type OptionalColumnKey = Exclude<ColumnKey, "maintenance" | "actions">;

export type ColumnWidths = Record<ColumnKey, number>;

export type VisibleColumns = Record<OptionalColumnKey, boolean>;
