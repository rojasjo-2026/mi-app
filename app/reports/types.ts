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

export type ReportMode = "builder" | "import" | "templates";

export type ReportColumn = {
  key: ClientColumnKey;
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
  installationStatus: string;
  pendingBilling: string;
  countryCode: string;
  adminLevel1: string;
  adminLevel2: string;
  adminLevel3: string;
  operationalZoneId: string;
  paymentTerm: string;
  preferredCurrency: string;
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

export type ClientReportResponse = {
  success: boolean;
  message?: string;
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

export type ReportBuilderMetadata = {
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

export type ReportMetadataResponse = {
  success: boolean;
  message?: string;
  data?: ReportBuilderMetadata;
};
