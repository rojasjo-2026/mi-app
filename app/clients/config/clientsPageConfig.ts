import type { ClientStatus } from "@/lib/clients/clientStatus";

export type Client = {
  client_id: string;

  client_type?: "PERSON" | "COMPANY" | "OTHER" | null;
  compliance_profile?: "GLOBAL" | "COSTA_RICA" | null;

  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;

  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;

  phone_primary: string;
  phone_secondary?: string | null;
  email?: string | null;

  country_code?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  address_line?: string | null;
  zone?: string | null;

  identification_country?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;
  tax_id?: string | null;

  client_status?: ClientStatus | null;
  whatsapp_opt_in?: boolean | null;

  default_payment_term?: "CASH" | "CREDIT" | null;
  default_credit_days?: number | null;
  default_discount_rate?: number | string | null;
  credit_limit?: number | string | null;
  preferred_currency?: string | null;

  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;

  maintenance_count?: number;
  installation_count?: number;
  pending_maintenance_count?: number;
  pending_invoice_count?: number;

  last_maintenance?: string | null;
  last_contact?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ClientMetrics = {
  total: number;
  active: number;
  withWhatsApp: number;
  attention: number;
};

export type StatusFilter = "all" | ClientStatus;
export type WhatsAppFilter = "all" | "with" | "without";
export type SortType = "name" | "recent";

export type SortKey =
  | "client"
  | "contact"
  | "location"
  | "operation"
  | "activity"
  | "status";

export type SortDirection = "asc" | "desc";

export type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export type ClientMetricCardProps = {
  title: string;
  value: string | number;
  detail: string;
  icon: string;
  accentClass: string;
  bgClass: string;
};

export const DEFAULT_PAGE_SIZE = 15;

export const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export const DEFAULT_COLUMN_WIDTHS = {
  client: 330,
  contact: 260,
  location: 240,
  operation: 180,
  activity: 180,
  status: 125,
};

export const MIN_COLUMN_WIDTHS: Record<
  keyof typeof DEFAULT_COLUMN_WIDTHS,
  number
> = {
  client: 300,
  contact: 230,
  location: 210,
  operation: 165,
  activity: 165,
  status: 115,
};

export type ClientTableColumnKey = keyof typeof DEFAULT_COLUMN_WIDTHS;
export type ToggleableColumnKey = Exclude<ClientTableColumnKey, "client">;

export const DEFAULT_VISIBLE_COLUMNS: Record<ToggleableColumnKey, boolean> = {
  contact: true,
  location: true,
  operation: false,
  activity: false,
  status: true,
};

export const OPTIONAL_COLUMNS: { key: ToggleableColumnKey; label: string }[] = [
  { key: "contact", label: "Contacto" },
  { key: "location", label: "Ubicación" },
  { key: "status", label: "Estado" },
  { key: "operation", label: "Operación" },
  { key: "activity", label: "Actividad" },
];
