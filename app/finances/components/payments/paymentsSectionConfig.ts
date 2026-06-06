import type { FinanceInvoice } from "../../types";

export type PaymentMethod = "CASH" | "SINPE" | "BANK_TRANSFER" | "CARD" | "OTHER";
export type PaymentStatusFilter = "ALL" | "PENDING" | "PARTIALLY_PAID" | "OVERDUE";
export type PaymentSortKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status";
export type SortDirection = "asc" | "desc";
export type ColumnKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status"
  | "action";
export type OptionalColumnKey = Exclude<ColumnKey, "invoice" | "action">;
export type VisibleColumns = Record<OptionalColumnKey, boolean>;

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type InvoiceMetrics = {
  totalInvoiced: number;
  pendingAmount: number;
  paidAmount: number;
  overdueAmount: number;
  cancelledAmount: number;
  overdueCount: number;
};

export type InvoicesApiResponse = {
  success: boolean;
  message?: string;
  data?: FinanceInvoice[];
  pagination?: PaginationState;
  metrics?: InvoiceMetrics;
};

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const STATUS_OPTIONS: { label: string; value: PaymentStatusFilter }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Parcialmente pagado", value: "PARTIALLY_PAID" },
  { label: "Vencido", value: "OVERDUE" },
];

export const OPTIONAL_COLUMNS: { key: OptionalColumnKey; label: string }[] = [
  { key: "client", label: "Cliente" },
  { key: "date", label: "Fecha" },
  { key: "dueDate", label: "Vencimiento" },
  { key: "total", label: "Total" },
  { key: "paid", label: "Pagado" },
  { key: "balance", label: "Saldo" },
  { key: "status", label: "Estado" },
];

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  client: true,
  date: true,
  dueDate: true,
  total: true,
  paid: true,
  balance: true,
  status: true,
};

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  invoice: "Factura",
  client: "Cliente",
  date: "Fecha",
  dueDate: "Vencimiento",
  total: "Total",
  paid: "Pagado",
  balance: "Saldo",
  status: "Estado",
  action: "Acción",
};

export const COLUMN_CLASSES: Record<ColumnKey, string> = {
  invoice: "minmax(160px,0.9fr)",
  client: "minmax(230px,1.2fr)",
  date: "minmax(125px,0.7fr)",
  dueDate: "minmax(140px,0.8fr)",
  total: "minmax(130px,0.75fr)",
  paid: "minmax(130px,0.75fr)",
  balance: "minmax(130px,0.75fr)",
  status: "minmax(165px,0.9fr)",
  action: "160px",
};

