"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { FinanceInvoice } from "../types";
import {
  formatCurrency,
  formatDateLabel,
  formatPaymentMethod,
  formatPaymentTerm,
  getBillingStatusLabel,
  getClientName,
  getInvoiceCurrency,
  getInvoiceOrigin,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
  toSafeNumber,
} from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import SectionHeader from "./SectionHeader";

type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type InvoiceMetrics = {
  totalInvoiced: number;
  pendingAmount: number;
  paidAmount: number;
  overdueAmount: number;
  cancelledAmount: number;
  overdueCount: number;
};

type InvoiceStatusFilter =
  | "ALL"
  | "DRAFT"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

type InvoiceSortKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status";

type SortDirection = "asc" | "desc";

type InvoiceColumnKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status";

type OptionalInvoiceColumnKey = Exclude<InvoiceColumnKey, "invoice" | "status">;

type VisibleInvoiceColumns = Record<OptionalInvoiceColumnKey, boolean>;

const INITIAL_VISIBLE_INVOICE_COLUMNS: VisibleInvoiceColumns = {
  client: true,
  date: true,
  dueDate: true,
  total: true,
  paid: false,
  balance: true,
};

const INVOICE_COLUMN_CONFIG: Record<
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

const OPTIONAL_INVOICE_COLUMNS: {
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

type InvoicesSectionProps = {
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

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const STATUS_OPTIONS: { label: string; value: InvoiceStatusFilter }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Parciales", value: "PARTIALLY_PAID" },
  { label: "Pagadas", value: "PAID" },
  { label: "Vencidas", value: "OVERDUE" },
  { label: "Canceladas", value: "CANCELLED" },
];

function DetailField({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  const displayValue = children ?? value ?? "-";
  const valueTitle =
    typeof displayValue === "string" || typeof displayValue === "number"
      ? String(displayValue)
      : undefined;

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p
        title={label}
        className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-slate-400"
      >
        {label}
      </p>

      <div
        title={valueTitle}
        className="mt-1 min-w-0 truncate text-sm font-bold text-slate-800"
      >
        {displayValue}
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  align = "left",
  onSortChange,
}: {
  label: string;
  sortKey: InvoiceSortKey;
  activeSortKey: InvoiceSortKey;
  sortDirection: SortDirection;
  align?: "left" | "right" | "center";
  onSortChange: (key: InvoiceSortKey) => void;
}) {
  const isActive = sortKey === activeSortKey;
  const indicator = isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕";
  const alignmentClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "justify-start text-left";

  return (
    <button
      type="button"
      title={`Ordenar por ${label}`}
      onClick={() => onSortChange(sortKey)}
      className={`flex min-w-0 items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition hover:text-slate-700 ${alignmentClass} ${
        isActive ? "text-slate-700" : "text-slate-400"
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none ${
          isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"
        }`}
      >
        {indicator}
      </span>
    </button>
  );
}

function InvoiceColumnPicker({
  isOpen,
  visibleColumns,
  onToggleColumn,
}: {
  isOpen: boolean;
  visibleColumns: VisibleInvoiceColumns;
  onToggleColumn: (columnKey: OptionalInvoiceColumnKey) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        Mostrar columnas
      </div>

      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
        Factura y Estado siempre permanecen visibles.
      </div>

      <div className="mt-2">
        {OPTIONAL_INVOICE_COLUMNS.map((column) => (
          <label
            key={column.key}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={visibleColumns[column.key]}
              onChange={() => onToggleColumn(column.key)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {column.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function InvoicePreviewPanel({
  invoice,
  onCancelInvoice,
  submittingInvoiceId,
}: {
  invoice: FinanceInvoice | null;
  onCancelInvoice: (invoice: FinanceInvoice) => void;
  submittingInvoiceId: string | null;
}) {
  if (!invoice) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-bold text-slate-800">Detalle de factura</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona una factura de la tabla para ver su desglose, pagos y
          acciones rápidas.
        </p>
      </aside>
    );
  }

  const invoiceCurrency = getInvoiceCurrency(invoice);
  const clientName =
    invoice.customer_snapshot_name || getClientName(invoice.client) || "-";
  const invoiceNumber = invoice.invoice_number || "Sin número";
  const status = invoice.status ?? "";
  const canCancel =
    ["PENDING", "OVERDUE"].includes(status) &&
    toSafeNumber(invoice.paid_amount) === 0;
  const isSubmitting =
    Boolean(invoice.invoice_id) && submittingInvoiceId === invoice.invoice_id;

  return (
    <aside className="sticky top-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Detalle de factura
        </p>

        <h2
          title={invoiceNumber}
          className="mt-2 truncate text-xl font-black tracking-tight text-slate-950"
        >
          {invoiceNumber}
        </h2>

        <p
          title={clientName}
          className="mt-1 truncate text-sm font-bold text-slate-600"
        >
          {clientName}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${getInvoiceStatusClass(
              invoice.status,
            )}`}
          >
            {getInvoiceStatusLabel(invoice.status)}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {invoiceCurrency}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <DetailField
            label="Total"
            value={formatCurrency(invoice.total_amount, invoiceCurrency)}
          />
          <DetailField
            label="Saldo"
            value={formatCurrency(invoice.balance_amount, invoiceCurrency)}
          />
          <DetailField
            label="Pagado"
            value={formatCurrency(invoice.paid_amount, invoiceCurrency)}
          />
          <DetailField
            label="Fecha"
            value={formatDateLabel(invoice.invoice_date)}
          />
          <DetailField
            label="Vence"
            value={formatDateLabel(invoice.due_date)}
          />
          <DetailField label="Origen" value={getInvoiceOrigin(invoice)} />
          <DetailField
            label="Pago"
            value={formatPaymentTerm(invoice.payment_term)}
          />
          <DetailField
            label="Impuesto"
            value={invoice.tax_exempt ? "Exento" : "Aplicable"}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">Desglose</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(invoice.subtotal_amount, invoiceCurrency)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Descuento</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(invoice.discount_amount, invoiceCurrency)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Impuesto</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(invoice.tax_amount, invoiceCurrency)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">Acciones rápidas</p>
          <p className="mt-1 text-xs font-medium leading-5 text-blue-700">
            Revisa pagos, cliente y trabajo relacionado sin perder la lista.
          </p>
        </div>

        <div className="grid gap-2">
          {invoice.client?.client_id && (
            <a
              href={`/clients/${invoice.client.client_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Ver cliente
            </a>
          )}

          {invoice.installation?.installation_id && (
            <a
              href={`/installations/${invoice.installation.installation_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver instalación
            </a>
          )}

          {invoice.follow_up?.follow_up_id && (
            <a
              href={`/follow-ups/${invoice.follow_up.follow_up_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver mantenimiento
            </a>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => onCancelInvoice(invoice)}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Cancelando..." : "Cancelar factura"}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            Historial de pagos
          </p>
          {!invoice.payments || invoice.payments.length === 0 ? (
            <p className="mt-2 text-sm font-medium text-slate-500">
              No hay pagos registrados.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {invoice.payments.slice(0, 4).map((payment) => (
                <div
                  key={payment.payment_id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="text-sm font-black text-slate-900">
                    {formatCurrency(payment.amount, invoiceCurrency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatPaymentMethod(payment.method)} ·{" "}
                    {formatDateLabel(payment.payment_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function InvoicesSection({
  invoices,
  loading,
  error,
  onRefresh,
  pagination,
  metrics,
  search,
  status,
  dateFrom,
  dateTo,
  pageSize,
  sortKey,
  sortDirection,
  onSearchChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}: InvoicesSectionProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [notification, setNotification] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);
  const [submittingInvoiceId, setSubmittingInvoiceId] = useState<string | null>(
    null,
  );
  const [visibleColumns, setVisibleColumns] = useState<VisibleInvoiceColumns>(
    INITIAL_VISIBLE_INVOICE_COLUMNS,
  );
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  const displayedColumns = useMemo<InvoiceColumnKey[]>(() => {
    const middleColumns = OPTIONAL_INVOICE_COLUMNS.filter(
      (column) => visibleColumns[column.key],
    ).map((column) => column.key);

    return ["invoice", ...middleColumns, "status"];
  }, [visibleColumns]);

  const gridTemplateColumns = useMemo(
    () =>
      displayedColumns
        .map((column) => `${INVOICE_COLUMN_CONFIG[column].width}px`)
        .join(" "),
    [displayedColumns],
  );

  const tableMinWidth = useMemo(
    () =>
      displayedColumns.reduce(
        (total, column) => total + INVOICE_COLUMN_CONFIG[column].width,
        0,
      ),
    [displayedColumns],
  );

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!isColumnMenuOpen) return;

      const target = event.target;

      if (
        target instanceof Node &&
        columnMenuRef.current &&
        !columnMenuRef.current.contains(target)
      ) {
        setIsColumnMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isColumnMenuOpen]);

  function toggleColumn(columnKey: OptionalInvoiceColumnKey) {
    setVisibleColumns((current) => ({
      ...current,
      [columnKey]: !current[columnKey],
    }));
  }

  const summaryCurrency =
    invoices.find((invoice) => invoice.currency)?.currency ?? "CRC";

  const selectedInvoice = useMemo(
    () =>
      invoices.find((invoice) => invoice.invoice_id === selectedInvoiceId) ??
      invoices[0] ??
      null,
    [invoices, selectedInvoiceId],
  );

  const handleCancelInvoice = async (invoice: FinanceInvoice) => {
    const invoiceId =
      typeof invoice.invoice_id === "string" ? invoice.invoice_id.trim() : "";

    if (!invoiceId) {
      setNotification({
        type: "error",
        message: "ID de factura no disponible.",
      });
      return;
    }

    const confirmed = window.confirm(
      "¿Seguro que quieres cancelar esta factura?",
    );

    if (!confirmed) return;

    const reason = window.prompt("Ingrese el motivo de la cancelación", "");

    if (reason === null) return;

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setNotification({
        type: "error",
        message: "La razón de cancelación no puede estar vacía.",
      });
      return;
    }

    setSubmittingInvoiceId(invoiceId);
    setNotification(null);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelled_reason: trimmedReason,
          changed_by: "Jose",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Error al cancelar la factura.");
      }

      setNotification({
        type: "success",
        message: "Factura cancelada exitosamente.",
      });

      onRefresh();
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "No se pudo cancelar la factura.",
      });
    } finally {
      setSubmittingInvoiceId(null);
    }
  };

  const visibleTotal = pagination.totalItems;
  const totalPages = Math.max(1, pagination.totalPages);
  const safeCurrentPage = Math.min(pagination.page || 1, totalPages);
  const pageStartIndex =
    visibleTotal === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEndIndex = Math.min(safeCurrentPage * pageSize, visibleTotal);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Facturas"
          title="Estado general de facturas"
          description="Resumen de facturación, cobros pendientes y facturas pagadas."
        />

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {metrics.overdueAmount > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">
            {metrics.overdueCount} factura
            {metrics.overdueCount === 1 ? "" : "s"} vencida
            {metrics.overdueCount === 1 ? "" : "s"}.
          </p>
          <p className="mt-1">
            Cobro urgente: saldo vencido total{" "}
            {formatCurrency(metrics.overdueAmount, summaryCurrency)}.
          </p>
        </div>
      )}

      {notification && (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FinanceSummaryCard
          label="Total facturado"
          value={formatCurrency(metrics.totalInvoiced, summaryCurrency)}
          helper="Sin canceladas"
        />

        <FinanceSummaryCard
          label="Pendiente"
          value={formatCurrency(metrics.pendingAmount, summaryCurrency)}
          helper="Pendiente de cobro"
        />

        <FinanceSummaryCard
          label="Pagado"
          value={formatCurrency(metrics.paidAmount, summaryCurrency)}
          helper="Pagos recibidos"
        />

        <FinanceSummaryCard
          label="Vencido"
          value={formatCurrency(metrics.overdueAmount, summaryCurrency)}
          helper="Facturas vencidas"
        />

        <FinanceSummaryCard
          label="Cancelado"
          value={formatCurrency(metrics.cancelledAmount, summaryCurrency)}
          helper="Facturas canceladas"
        />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr_0.55fr_0.55fr_0.45fr_0.45fr]">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por factura, cliente, teléfono, servicio o cédula"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />

          <select
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as InvoiceStatusFilter)
            }
            title="Filtrar por estado"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Desde
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
            />
          </label>

          <label className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Hasta
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
            />
          </label>

          <div ref={columnMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsColumnMenuOpen((current) => !current)}
              className="inline-flex h-full w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Columnas
            </button>

            <InvoiceColumnPicker
              isOpen={isColumnMenuOpen}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
          </div>

          <label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
            Ver
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="bg-transparent text-sm font-bold outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {(dateFrom || dateTo) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm">
              Filtrando por fecha de emisión
              {dateFrom ? ` desde ${dateFrom}` : ""}
              {dateTo ? ` hasta ${dateTo}` : ""}
            </span>
            <button
              type="button"
              onClick={() => {
                onDateFromChange("");
                onDateToChange("");
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 font-bold text-slate-600 transition hover:bg-slate-100"
            >
              Limpiar fechas
            </button>
          </div>
        )}
      </div>

      {loading && invoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando facturas...
          </p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Todavía no hay facturas con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <div style={{ minWidth: tableMinWidth }}>
                <div
                  style={{ gridTemplateColumns }}
                  className="grid border-b border-slate-200 bg-slate-50"
                >
                  {displayedColumns.map((column) => {
                    const config = INVOICE_COLUMN_CONFIG[column];

                    return (
                      <SortableHeader
                        key={column}
                        label={config.label}
                        sortKey={config.sortKey}
                        activeSortKey={sortKey}
                        sortDirection={sortDirection}
                        align={config.align}
                        onSortChange={onSortChange}
                      />
                    );
                  })}
                </div>

                <ul className="divide-y divide-slate-100">
                  {invoices.map((invoice, index) => {
                    const invoiceCurrency = getInvoiceCurrency(invoice);
                    const invoiceId =
                      invoice.invoice_id ||
                      `${invoice.invoice_number}-${index}`;
                    const clientName =
                      invoice.customer_snapshot_name ||
                      getClientName(invoice.client) ||
                      "-";
                    const isSelected =
                      selectedInvoice?.invoice_id === invoice.invoice_id;

                    return (
                      <li
                        key={invoiceId}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedInvoiceId(invoice.invoice_id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedInvoiceId(invoice.invoice_id);
                          }
                        }}
                        style={{ gridTemplateColumns }}
                        className={`grid min-h-[74px] cursor-pointer transition hover:bg-blue-50/70 ${
                          isSelected
                            ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                            : "bg-white"
                        }`}
                      >
                        {displayedColumns.map((column) => {
                          if (column === "invoice") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={invoice.invoice_number || "Sin número"}
                                  className="truncate text-sm font-black text-slate-950"
                                >
                                  {invoice.invoice_number || "Sin número"}
                                </span>
                              </div>
                            );
                          }

                          if (column === "client") {
                            return (
                              <div
                                key={column}
                                className="min-w-0 border-r border-slate-100 px-4 py-3"
                              >
                                <p
                                  title={clientName}
                                  className="truncate text-sm font-bold text-slate-900"
                                >
                                  {clientName}
                                </p>
                                <p
                                  title={getInvoiceOrigin(invoice)}
                                  className="mt-1 truncate text-xs font-medium text-slate-500"
                                >
                                  {getInvoiceOrigin(invoice)}
                                </p>
                              </div>
                            );
                          }

                          if (column === "date") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={formatDateLabel(invoice.invoice_date)}
                                  className="truncate text-sm font-semibold text-slate-700"
                                >
                                  {formatDateLabel(invoice.invoice_date)}
                                </span>
                              </div>
                            );
                          }

                          if (column === "dueDate") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={formatDateLabel(invoice.due_date)}
                                  className="truncate text-sm font-semibold text-slate-700"
                                >
                                  {formatDateLabel(invoice.due_date)}
                                </span>
                              </div>
                            );
                          }

                          if (column === "total") {
                            const totalLabel = formatCurrency(
                              invoice.total_amount,
                              invoiceCurrency,
                            );

                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={totalLabel}
                                  className="truncate text-sm font-black text-slate-900"
                                >
                                  {totalLabel}
                                </span>
                              </div>
                            );
                          }

                          if (column === "paid") {
                            const paidLabel = formatCurrency(
                              invoice.paid_amount,
                              invoiceCurrency,
                            );

                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={paidLabel}
                                  className="truncate text-sm font-bold text-emerald-700"
                                >
                                  {paidLabel}
                                </span>
                              </div>
                            );
                          }

                          if (column === "balance") {
                            const balanceLabel = formatCurrency(
                              invoice.balance_amount,
                              invoiceCurrency,
                            );

                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={balanceLabel}
                                  className="truncate text-sm font-bold text-red-700"
                                >
                                  {balanceLabel}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={column}
                              className="flex min-w-0 items-center justify-center px-4 py-3"
                            >
                              <span
                                title={getInvoiceStatusLabel(invoice.status)}
                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getInvoiceStatusClass(invoice.status)}`}
                              >
                                {getInvoiceStatusLabel(invoice.status)}
                              </span>
                            </div>
                          );
                        })}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Mostrando {pageStartIndex}-{pageEndIndex} de {visibleTotal}{" "}
                facturas · Página {safeCurrentPage} de {totalPages}
                {loading && invoices.length > 0 ? " · Actualizando..." : ""}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onPageChange(Math.min(totalPages, safeCurrentPage + 1))
                  }
                  disabled={safeCurrentPage >= totalPages}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>

          <InvoicePreviewPanel
            invoice={selectedInvoice}
            onCancelInvoice={handleCancelInvoice}
            submittingInvoiceId={submittingInvoiceId}
          />
        </div>
      )}
    </div>
  );
}
