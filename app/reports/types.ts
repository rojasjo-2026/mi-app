export type ReportSource = "clients" | "installations";

export type ClientColumnKey =
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
  | "operational_zone"
  | "zone"
  | "address_line"
  | "tax_id"
  | "identification_type"
  | "identification_number"
  | "default_payment_term"
  | "default_credit_days"
  | "preferred_currency"
  | "tax_exempt"
  | "billing_name"
  | "billing_email"
  | "billing_phone"
  | "billing_address"
  | "installations_count"
  | "follow_ups_count"
  | "contact_attempts_count"
  | "invoices_count"
  | "pending_billing"
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

export type ReportColumnKey = ClientColumnKey | InstallationColumnKey;

export type ReportMode = "builder" | "import" | "templates";

export type ReportColumn = {
  key: ReportColumnKey;
  label: string;
  description: string;
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
  installationStatus: string;
  billingStatus: string;
  isActive: string;
  pendingMaintenance: string;

  pendingBilling: string;
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
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
};

export type ReportRow = Record<string, string | number>;

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ReportBuilderResponse = {
  success: boolean;
  message?: string;
  source?: ReportSource;
  columns?: string[];
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
  status: "created" | "skipped" | "error";
  clientName: string;
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
  paymentTerms: ReportOption[];
  currencies: ReportOption[];
  operationalZones: ReportOption[];
  booleanOptions: {
    whatsapp: ReportOption[];
    autoContact: ReportOption[];
    taxExempt: ReportOption[];
  };
  counters: {
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
