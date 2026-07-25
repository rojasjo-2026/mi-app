export type { AppSettingsResponse } from "@/lib/settings/appSettingsUtils";

export {
  DEFAULT_COUNTRY_CODE,
  fallbackCountryPreset,
} from "@/lib/settings/appSettingsUtils";

export type OperationalZoneOption = {
  operational_zone_id: string;
  name: string;
  color_label?: string | null;
  is_active?: boolean;
};

export type OperationalZoneFilter =
  | "all"
  | "without"
  | (string & Record<never, never>);

export type InstallationItem = {
  installation_id: string;
  installation_date: string;
  description: string | null;
  technician_name: string | null;
  installation_status: string;
  estimated_amount?: number | null;

  zone?: string | null;
  city?: string | null;
  address_line?: string | null;

  operational_zone_id?: string | null;
  operational_zone?: OperationalZoneOption | null;

  client?: {
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
    client_id?: string | null;
  } | null;

  service_type?: {
    name?: string | null;
  } | null;
};

export type FilterType =
  | "all"
  | "OPEN"
  | "IN_PROGRESS"
  | "CLOSED"
  | "CANCELLED";

export type SortType = "recent" | "oldest";

export type SortDirection = "asc" | "desc";

export type ColumnKey =
  | "installation"
  | "client"
  | "service"
  | "date"
  | "technician"
  | "location"
  | "operationalZone"
  | "amount"
  | "status"
  | "actions";

export type SortKey = Exclude<ColumnKey, "actions">;

export type OptionalColumnKey = Exclude<ColumnKey, "installation" | "actions">;

export type ColumnWidths = Record<ColumnKey, number>;

export type VisibleColumns = Record<OptionalColumnKey, boolean>;

export const STATUS_FILTERS: {
  label: string;
  value: FilterType;
}[] = [
  {
    label: "Todas",
    value: "all",
  },
  {
    label: "Abiertas",
    value: "OPEN",
  },
  {
    label: "En proceso",
    value: "IN_PROGRESS",
  },
  {
    label: "Completadas",
    value: "CLOSED",
  },
  {
    label: "Canceladas",
    value: "CANCELLED",
  },
];

export const OPTIONAL_COLUMNS: {
  key: OptionalColumnKey;
  label: string;
}[] = [
  {
    key: "client",
    label: "Cliente",
  },
  {
    key: "service",
    label: "Servicio",
  },
  {
    key: "date",
    label: "Fecha",
  },
  {
    key: "technician",
    label: "Técnico",
  },
  {
    key: "location",
    label: "Ubicación",
  },
  {
    key: "operationalZone",
    label: "Zona operativa",
  },
  {
    key: "amount",
    label: "Monto estimado",
  },
  {
    key: "status",
    label: "Estado",
  },
];

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  installation: "Instalación",
  client: "Cliente",
  service: "Servicio",
  date: "Fecha",
  technician: "Técnico",
  location: "Ubicación",
  operationalZone: "Zona operativa",
  amount: "Monto estimado",
  status: "Estado",
  actions: "Acciones",
};

export const INITIAL_COLUMN_WIDTHS: ColumnWidths = {
  installation: 340,
  client: 220,
  service: 210,
  date: 130,
  technician: 220,
  location: 270,
  operationalZone: 210,
  amount: 165,
  status: 140,
  actions: 210,
};

export const MIN_COLUMN_WIDTHS: ColumnWidths = {
  installation: 300,
  client: 170,
  service: 160,
  date: 110,
  technician: 170,
  location: 190,
  operationalZone: 180,
  amount: 135,
  status: 120,
  actions: 210,
};

export const INITIAL_VISIBLE_COLUMNS: VisibleColumns = {
  client: true,
  service: true,
  date: true,
  technician: false,
  location: false,
  operationalZone: true,
  amount: false,
  status: true,
};

export const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type InstallationMetrics = {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  cancelled: number;
};
