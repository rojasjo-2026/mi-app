export type RegisteredReportSource = "clients" | "installations" | "follow-ups";

export type ActiveReportSource = RegisteredReportSource;

export type ReportSource = RegisteredReportSource;

export type ClientColumnKey =
  | "client_id"
  | "client_name"
  | "client_type"
  | "phone_primary"
  | "phone_secondary"
  | "email"
  | "client_status"
  | "whatsapp_opt_in"
  | "auto_contact_enabled"
  | "country_code"
  | "admin_level_1"
  | "admin_level_2"
  | "admin_level_3"
  | "city"
  | "zone"
  | "address_line"
  | "operational_zone"
  | "installations_count"
  | "follow_ups_count"
  | "contact_attempts_count"
  | "invoices_count"
  | "pending_billing"
  | "default_payment_term"
  | "preferred_currency"
  | "tax_exempt"
  | "created_at"
  | "updated_at";

export type InstallationColumnKey =
  | "installation_id"
  | "client_name"
  | "service_type"
  | "installation_date"
  | "installation_status"
  | "is_active"
  | "billing_status"
  | "estimated_amount"
  | "final_amount"
  | "cost_amount"
  | "pending_billing"
  | "warranty_months"
  | "warranty_end_date"
  | "technician_name"
  | "address_line"
  | "city"
  | "admin_level_1"
  | "admin_level_2"
  | "admin_level_3"
  | "zone"
  | "operational_zone"
  | "components_count"
  | "follow_ups_count"
  | "pending_follow_up_date"
  | "invoices_count"
  | "description"
  | "technical_observations"
  | "reference_point"
  | "location_notes"
  | "created_at"
  | "updated_at";

export type FollowUpColumnKey =
  | "follow_up_id"
  | "client_name"
  | "installation_reference"
  | "installation_service_type"
  | "follow_up_status"
  | "target_date"
  | "due_date"
  | "scheduled_date"
  | "completed_at"
  | "is_completed"
  | "priority"
  | "maintenance_type"
  | "technician_name"
  | "created_from"
  | "billing_status"
  | "estimated_amount"
  | "final_amount"
  | "cost_amount"
  | "pending_billing"
  | "contact_attempts_count"
  | "contact_flows_count"
  | "follow_up_notes_count"
  | "invoices_count"
  | "operational_zone"
  | "reason"
  | "notes"
  | "billing_notes"
  | "billing_block_reason"
  | "created_at"
  | "updated_at";

export type ReportColumnKey =
  | ClientColumnKey
  | InstallationColumnKey
  | FollowUpColumnKey;

export type ReportMode = "builder" | "import" | "templates";

export type ReportColumn = {
  key: ReportColumnKey;
  label: string;
  description: string;
  group: string;
};

export type ReportFilters = {
  search: string;

  clientType: string;
  status: string;
  whatsapp: string;
  autoContact: string;
  taxExempt: string;

  clientId: string;
  serviceTypeId: string;
  technicianId: string;
  installationId: string;
  followUpStatusId: string;

  installationStatus: string;
  billingStatus: string;
  isActive: string;
  completionStatus: string;

  pendingBilling: string;
  pendingMaintenance: string;
  contactFlow: string;
  contactAttempts: string;

  priority: string;
  maintenanceType: string;
  createdFromSource: string;

  countryCode: string;
  adminLevel1: string;
  adminLevel2: string;
  adminLevel3: string;
  city: string;
  zone: string;
  operationalZoneId: string;

  paymentTerm: string;
  preferredCurrency: string;

  minEstimatedAmount: string;
  maxEstimatedAmount: string;

  installationFrom: string;
  installationTo: string;
  warrantyFrom: string;
  warrantyTo: string;

  targetFrom: string;
  targetTo: string;
  dueFrom: string;
  dueTo: string;
  scheduledFrom: string;
  scheduledTo: string;
  completedFrom: string;
  completedTo: string;

  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
};

export type ReportRow = Partial<Record<ReportColumnKey, string | number>>;

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ReportBuilderResponse = {
  success: boolean;
  source?: ReportSource;
  message?: string;
  columns?: ReportColumnKey[];
  data?: ReportRow[];
  pagination?: PaginationState;
};

export type ClientImportRowInput = Record<
  string,
  string | number | boolean | null
>;

export type ImportPreviewRow = {
  rowNumber: number;
  clientName: string;
  phone: string;
  email: string;
  status: "Valid" | "Error";
  message: string;
  rawData: ClientImportRowInput;
};

export type ClientImportCommitDetail = {
  rowNumber: number;
  clientName: string;
  status: "created" | "skipped" | "error";
  message: string;
};

export type ClientImportCommitResponse = {
  success: boolean;
  message?: string;
  createdCount?: number;
  skippedCount?: number;
  errorCount?: number;
  details?: ClientImportCommitDetail[];
};

export type ReportOption = {
  value: string;
  label: string;
  count?: number;
};

export type ClientReportBuilderMetadata = {
  clientTypes: ReportOption[];
  clientStatuses: ReportOption[];
  countries: ReportOption[];
  adminLevel1Options: ReportOption[];
  adminLevel2Options: ReportOption[];
  adminLevel3Options: ReportOption[];
  operationalZones: ReportOption[];
  paymentTerms: ReportOption[];
  currencies: ReportOption[];
  booleanOptions: {
    whatsapp: ReportOption[];
    autoContact: ReportOption[];
    taxExempt: ReportOption[];
  };
  counters: {
    totalClients?: number;
    withoutOperationalZoneCount: number;
  };
};

export type InstallationReportBuilderMetadata = {
  installationStatuses: ReportOption[];
  billingStatuses: ReportOption[];
  serviceTypes: ReportOption[];
  technicians: ReportOption[];
  clients: ReportOption[];
  countries: ReportOption[];
  adminLevel1Options: ReportOption[];
  adminLevel2Options: ReportOption[];
  adminLevel3Options: ReportOption[];
  cityOptions: ReportOption[];
  zoneOptions: ReportOption[];
  operationalZones: ReportOption[];
  booleanOptions: {
    isActive: ReportOption[];
    pendingBilling: ReportOption[];
    pendingMaintenance: ReportOption[];
  };
  counters: {
    totalInstallations: number;
    withoutTechnicianCount: number;
    withoutOperationalZoneCount: number;
    pendingBillingCount: number;
    pendingMaintenanceCount: number;
  };
};

export type FollowUpReportBuilderMetadata = {
  followUpStatuses: ReportOption[];
  billingStatuses: ReportOption[];
  priorityOptions: ReportOption[];
  maintenanceTypes: ReportOption[];
  createdFromOptions: ReportOption[];
  clients: ReportOption[];
  installations: ReportOption[];
  technicians: ReportOption[];
  operationalZones: ReportOption[];
  countries: ReportOption[];
  booleanOptions: {
    completionStatus: ReportOption[];
    pendingBilling: ReportOption[];
    contactFlow: ReportOption[];
    contactAttempts: ReportOption[];
  };
  counters: {
    totalFollowUps: number;
    completedCount: number;
    pendingCount: number;
    overdueCount: number;
    withoutInstallationCount: number;
    withoutTechnicianCount: number;
    withoutOperationalZoneCount: number;
    pendingBillingCount: number;
    contactFlowCount: number;
    contactAttemptsCount: number;
  };
};

export type ClientMetadataResponse = {
  success: boolean;
  message?: string;
  data?: ClientReportBuilderMetadata;
};

export type InstallationMetadataResponse = {
  success: boolean;
  message?: string;
  data?: InstallationReportBuilderMetadata;
};

export type FollowUpMetadataResponse = {
  success: boolean;
  message?: string;
  data?: FollowUpReportBuilderMetadata;
};
