export type { AppSettingsResponse } from "@/lib/settings/appSettingsUtils";
export {
  DEFAULT_COUNTRY_CODE,
  fallbackCountryPreset,
} from "@/lib/settings/appSettingsUtils";

import type { PendingBillable, PendingBillablesResponse } from "../../types";

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PendingSortKey =
  | "type"
  | "client"
  | "work"
  | "date"
  | "amount"
  | "cost"
  | "profit"
  | "status";

export type SortDirection = "asc" | "desc";

export type ColumnKey =
  | "type"
  | "client"
  | "work"
  | "date"
  | "amount"
  | "cost"
  | "profit"
  | "status"
  | "action";

export type OptionalColumnKey = Exclude<ColumnKey, "client" | "action">;
export type VisibleColumns = Record<OptionalColumnKey, boolean>;

export type PendingBillablesSectionProps = {
  items: PendingBillable[];
  summary?: PendingBillablesResponse["summary"];
  loading: boolean;
  error: string;
  search: string;
  status: string;
  dateFrom?: string;
  dateTo?: string;
  selectedBillable: PendingBillable | null;
  pagination?: PaginationState;
  pageSize?: number;
  sortKey?: PendingSortKey;
  sortDirection?: SortDirection;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onRefresh: () => void;
  onSelectBillable: (item: PendingBillable) => void;
  onClearSelection: () => void;
  onInvoiceCreated: () => void;
  onPageChange?: (value: number) => void;
  onPageSizeChange?: (value: number) => void;
  onSortChange?: (key: PendingSortKey) => void;
};

export const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export const OPTIONAL_COLUMNS: { key: OptionalColumnKey; label: string }[] = [
  { key: "type", label: "Tipo" },
  { key: "work", label: "Trabajo" },
  { key: "date", label: "Fecha" },
  { key: "amount", label: "Monto" },
  { key: "cost", label: "Costo" },
  { key: "profit", label: "Utilidad" },
  { key: "status", label: "Estado" },
];

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  type: false,
  work: true,
  date: true,
  amount: true,
  cost: false,
  profit: false,
  status: true,
};

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  type: "Tipo",
  client: "Cliente",
  work: "Trabajo",
  date: "Fecha",
  amount: "Monto",
  cost: "Costo",
  profit: "Utilidad",
  status: "Estado",
  action: "Acción",
};

export const COLUMN_CLASSES: Record<ColumnKey, string> = {
  type: "minmax(120px,0.6fr)",
  client: "minmax(220px,1fr)",
  work: "minmax(260px,1.3fr)",
  date: "minmax(130px,0.7fr)",
  amount: "minmax(130px,0.75fr)",
  cost: "minmax(130px,0.75fr)",
  profit: "minmax(130px,0.75fr)",
  status: "minmax(145px,0.75fr)",
  action: "150px",
};
