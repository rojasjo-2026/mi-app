import type {
  ColumnKey,
  ColumnWidths,
  OptionalColumnKey,
  VisibleColumns,
} from "../types/followUpsPageTypes";

export const DEFAULT_COUNTRY_CODE = "CR";

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const INITIAL_COLUMN_WIDTHS: ColumnWidths = {
  maintenance: 320,
  client: 220,
  installation: 260,
  targetDate: 150,
  scheduledDate: 160,
  technician: 220,
  priority: 140,
  amount: 150,
  billing: 190,
  status: 150,
  actions: 160,
};

export const MIN_COLUMN_WIDTHS: ColumnWidths = {
  maintenance: 280,
  client: 180,
  installation: 210,
  targetDate: 130,
  scheduledDate: 140,
  technician: 170,
  priority: 120,
  amount: 130,
  billing: 150,
  status: 130,
  actions: 160,
};

export const INITIAL_VISIBLE_COLUMNS: VisibleColumns = {
  client: true,
  installation: true,
  targetDate: true,
  scheduledDate: false,
  technician: false,
  priority: true,
  amount: false,
  billing: true,
  status: true,
};

export const OPTIONAL_COLUMNS: { key: OptionalColumnKey; label: string }[] = [
  { key: "client", label: "Cliente" },
  { key: "installation", label: "Instalación" },
  { key: "targetDate", label: "Fecha objetivo" },
  { key: "scheduledDate", label: "Fecha agendada" },
  { key: "technician", label: "Técnico" },
  { key: "priority", label: "Prioridad" },
  { key: "amount", label: "Monto" },
  { key: "billing", label: "Facturación" },
  { key: "status", label: "Estado" },
];

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  maintenance: "Mantenimiento",
  client: "Cliente",
  installation: "Instalación",
  targetDate: "Fecha objetivo",
  scheduledDate: "Fecha agendada",
  technician: "Técnico",
  priority: "Prioridad",
  amount: "Monto",
  billing: "Facturación",
  status: "Estado",
  actions: "Acciones",
};
