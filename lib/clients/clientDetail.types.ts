import type { ClientStatus } from "@/lib/clients/clientStatus";

export type ClientType = "PERSON" | "COMPANY" | "OTHER";

export type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

export type ClientFollowUp = {
  follow_up_id: string;
  target_date: string;
  reason?: string | null;
  priority?: number | null;
  estimated_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  follow_up_status?: {
    code?: string | null;
    name?: string | null;
  } | null;
};

export type ClientInstallation = {
  installation_id: string;
  description?: string | null;
  installation_date?: string | null;
  installation_status?: string | null;
  estimated_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  address_line?: string | null;
  city?: string | null;
  zone?: string | null;
  is_active?: boolean | null;
  service_type?: {
    name?: string | null;
  } | null;
  follow_ups?: ClientFollowUp[];
};

export type CommercialItem = {
  id: string;
  type: "INSTALLATION" | "FOLLOW_UP";
  description: string;
  date?: string | null;
  estimatedAmount: number;
  costAmount: number;
  billingStatus?: string | null;
};

export type ClientActivityLog = {
  activity_id: string;
  client_id: string;
  entity_type: string;
  entity_id: string;
  category: string;
  action: string;
  visibility: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  title: string;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
};

export type ActivityLogsResponse = {
  success: boolean;
  data: ClientActivityLog[];
  message?: string;
};

export type DetailSectionKey =
  | "commercial"
  | "main"
  | "identification"
  | "business"
  | "location"
  | "finance"
  | "billing"
  | "installations"
  | "history";

export type ClientDetail = {
  client_id: string;

  client_type?: ClientType | null;
  compliance_profile?: ClientComplianceProfile | null;
  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;

  identification_country?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;

  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
  phone_primary: string;
  phone_secondary?: string | null;
  email?: string | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  client_status?: ClientStatus | string | null;
  whatsapp_opt_in?: boolean | null;

  default_payment_term?: "CASH" | "CREDIT" | null;
  default_credit_days?: number | string | null;
  default_discount_rate?: number | string | null;
  credit_limit?: number | string | null;
  billing_same_as_client?: boolean | null;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  tax_exempt?: boolean | null;
  preferred_currency?: "CRC" | "USD" | null;

  installations?: ClientInstallation[];
};

export type InstallationFilter = "all" | "active" | "inactive";

export type ClientDetailResponse = {
  success: boolean;
  data?: ClientDetail;
  message?: string;
};

export type CommercialSummary = {
  items: CommercialItem[];
  recentItems: CommercialItem[];
  totalEstimated: number;
  totalCost: number;
  pendingAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  profitAmount: number;
};
