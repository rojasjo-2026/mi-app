import type { ClientStatus } from "@/lib/clients/clientStatus";

export type Client = {
  client_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  phone_primary: string;
  email?: string | null;
  client_status?: ClientStatus | null;
  whatsapp_opt_in?: boolean | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  maintenance_count?: number;
  installation_count?: number;
  last_maintenance?: string | null;
  last_contact?: string | null;
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

export const DEFAULT_COLUMN_WIDTHS = {
  client: 330,
  contact: 280,
  location: 250,
  operation: 185,
  activity: 185,
  status: 125,
};

export const MIN_COLUMN_WIDTHS: Record<keyof typeof DEFAULT_COLUMN_WIDTHS, number> = {
  client: 300,
  contact: 230,
  location: 210,
  operation: 165,
  activity: 165,
  status: 115,
};

export type ClientTableColumnKey = keyof typeof DEFAULT_COLUMN_WIDTHS;
export type ToggleableColumnKey = Exclude<ClientTableColumnKey, "client">;

export const OPTIONAL_COLUMNS: { key: ToggleableColumnKey; label: string }[] = [
  { key: "contact", label: "Contacto" },
  { key: "location", label: "Ubicación" },
  { key: "operation", label: "Operación" },
  { key: "activity", label: "Actividad" },
  { key: "status", label: "Estado" },
];

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

