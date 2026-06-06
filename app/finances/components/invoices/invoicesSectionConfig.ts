import type { FinanceInvoice } from "../../types";

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

export type InvoiceStatusFilter =
  | "ALL"
  | "DRAFT"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type InvoiceSortKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status";

export type SortDirection = "asc" | "desc";

export type InvoiceColumnKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status";

export type OptionalInvoiceColumnKey = Exclude<InvoiceColumnKey, "invoice" | "status">;

export type VisibleInvoiceColumns = Record<OptionalInvoiceColumnKey, boolean>;

export const INITIAL_VISIBLE_INVOICE_COLUMNS: VisibleInvoiceColumns = {
  client: true,
  date: true,
  dueDate: true,
  total: true,
  paid: false,
  balance: true,
};

export const INVOICE_COLUMN_CONFIG: Record<
  InvoiceColumnKey,
  {
    label: string;
    sortKey: InvoiceSortKey;
    width: number;
    align?: "left" | "right" | "center";
  }
> = {
  invoice: { label: "Factura", sortKey: "invoice", width: 170 },
  client: { label: "Cliente", sortKey: "client", width: 260 },
  date: { label: "Fecha", sortKey: "date", width: 130 },
  dueDate: { label: "Vence", sortKey: "dueDate", width: 130 },
  total: { label: "Total", sortKey: "total", width: 150, align: "right" },
  paid: { label: "Pagado", sortKey: "paid", width: 150, align: "right" },
  balance: { label: "Saldo", sortKey: "balance", width: 150, align: "right" },
  status: { label: "Estado", sortKey: "status", width: 150, align: "center" },
};

export const OPTIONAL_INVOICE_COLUMNS: {
  key: OptionalInvoiceColumnKey;
  label: string;
}[] = [
  { key: "client", label: "Cliente" },
  { key: "date", label: "Fecha" },
  { key: "dueDate", label: "Vence" },
  { key: "total", label: "Total" },
  { key: "paid", label: "Pagado" },
  { key: "balance", label: "Saldo" },
];

export type InvoicesSectionProps = {
  invoices: FinanceInvoice[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  pagination: PaginationState;
  metrics: InvoiceMetrics;
  search: string;
  status: InvoiceStatusFilter;
  dateFrom: string;
  dateTo: string;
  pageSize: number;
  sortKey: InvoiceSortKey;
  sortDirection: SortDirection;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: InvoiceStatusFilter) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onSortChange: (key: InvoiceSortKey) => void;
};

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const STATUS_OPTIONS: { label: string; value: InvoiceStatusFilter }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Parciales", value: "PARTIALLY_PAID" },
  { label: "Pagadas", value: "PAID" },
  { label: "Vencidas", value: "OVERDUE" },
  { label: "Canceladas", value: "CANCELLED" },
];

