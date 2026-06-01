"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { FinanceInvoice } from "../types";
import {
  formatCurrency,
  formatDateLabel,
  getClientName,
  getInvoiceCurrency,
  getInvoiceOrigin,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
  toSafeNumber,
} from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import SectionHeader from "./SectionHeader";

type PaymentMethod = "CASH" | "SINPE" | "BANK_TRANSFER" | "CARD" | "OTHER";
type PaymentStatusFilter = "ALL" | "PENDING" | "PARTIALLY_PAID" | "OVERDUE";
type PaymentSortKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status";
type SortDirection = "asc" | "desc";
type ColumnKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status"
  | "action";
type OptionalColumnKey = Exclude<ColumnKey, "invoice" | "action">;
type VisibleColumns = Record<OptionalColumnKey, boolean>;

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

type InvoicesApiResponse = {
  success: boolean;
  message?: string;
  data?: FinanceInvoice[];
  pagination?: PaginationState;
  metrics?: InvoiceMetrics;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const STATUS_OPTIONS: { label: string; value: PaymentStatusFilter }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Parcialmente pagado", value: "PARTIALLY_PAID" },
  { label: "Vencido", value: "OVERDUE" },
];

const OPTIONAL_COLUMNS: { key: OptionalColumnKey; label: string }[] = [
  { key: "client", label: "Cliente" },
  { key: "date", label: "Fecha" },
  { key: "dueDate", label: "Vencimiento" },
  { key: "total", label: "Total" },
  { key: "paid", label: "Pagado" },
  { key: "balance", label: "Saldo" },
  { key: "status", label: "Estado" },
];

const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  client: true,
  date: true,
  dueDate: true,
  total: true,
  paid: true,
  balance: true,
  status: true,
};

const COLUMN_LABELS: Record<ColumnKey, string> = {
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

const COLUMN_CLASSES: Record<ColumnKey, string> = {
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

function getGridTemplate(columns: ColumnKey[]) {
  return columns.map((column) => COLUMN_CLASSES[column]).join(" ");
}

function getPaginationStartEnd(pagination: PaginationState) {
  const totalItems = pagination.totalItems;
  const pageSize = pagination.pageSize || 25;
  const currentPage = pagination.page || 1;

  return {
    start: totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1,
    end: Math.min(currentPage * pageSize, totalItems),
  };
}

function getDueLabel(invoice: FinanceInvoice) {
  if (!invoice.due_date) return "-";

  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return `Vencido (${Math.abs(diffDays)} días)`;
  if (diffDays === 0) return "Vence hoy";
  return formatDateLabel(invoice.due_date);
}

function SortableHeader({
  columnKey,
  label,
  activeSortKey,
  sortDirection,
  onSortChange,
  align = "left",
}: {
  columnKey: ColumnKey;
  label: string;
  activeSortKey: PaymentSortKey;
  sortDirection: SortDirection;
  onSortChange: (key: PaymentSortKey) => void;
  align?: "left" | "right" | "center";
}) {
  const isSortable = columnKey !== "action";
  const isActive = isSortable && columnKey === activeSortKey;
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
      disabled={!isSortable}
      title={isSortable ? `Ordenar por ${label}` : undefined}
      onClick={() => {
        if (isSortable) onSortChange(columnKey as PaymentSortKey);
      }}
      className={`flex min-w-0 items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition ${alignmentClass} ${
        isActive ? "text-slate-700" : "text-slate-400"
      } ${isSortable ? "hover:text-slate-700" : "cursor-default"}`}
    >
      <span className="truncate">{label}</span>
      {isSortable && (
        <span
          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none ${
            isActive
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {indicator}
        </span>
      )}
    </button>
  );
}

function ColumnPicker({
  isOpen,
  visibleColumns,
  onToggleColumn,
}: {
  isOpen: boolean;
  visibleColumns: VisibleColumns;
  onToggleColumn: (columnKey: OptionalColumnKey) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        Mostrar columnas
      </div>

      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
        Factura y Acción siempre permanecen visibles.
      </div>

      <div className="mt-2">
        {OPTIONAL_COLUMNS.map((column) => (
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

function PaymentField({
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

export default function PaymentsSection() {
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatusFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<PaymentSortKey>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState<InvoiceMetrics>({
    totalInvoiced: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    cancelledAmount: 0,
    overdueCount: 0,
  });

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("SINPE");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(
    DEFAULT_VISIBLE_COLUMNS,
  );
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  const displayedColumns = useMemo<ColumnKey[]>(() => {
    const optionalColumns = OPTIONAL_COLUMNS.filter(
      (column) => visibleColumns[column.key],
    ).map((column) => column.key);

    return ["invoice", ...optionalColumns, "action"];
  }, [visibleColumns]);

  const gridTemplateColumns = useMemo(
    () => getGridTemplate(displayedColumns),
    [displayedColumns],
  );

  const summaryCurrency =
    invoices.find((invoice) => invoice.currency)?.currency ?? "CRC";

  const pageRange = getPaginationStartEnd(pagination);
  const totalPages = Math.max(1, pagination.totalPages);
  const safeCurrentPage = Math.min(pagination.page || 1, totalPages);

  async function loadInvoices() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      params.set("balanceDue", "true");
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));
      params.set("sortKey", sortKey);
      params.set("sortDirection", sortDirection);

      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/invoices?${params.toString()}`, {
        cache: "no-store",
      });

      const result: InvoicesApiResponse = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudieron cargar las facturas");
      }

      const nextInvoices = Array.isArray(result.data) ? result.data : [];
      const nextPagination = result.pagination ?? {
        page: currentPage,
        pageSize,
        totalItems: nextInvoices.length,
        totalPages: 1,
      };

      setInvoices(nextInvoices);
      setPagination(nextPagination);
      setMetrics({
        totalInvoiced: Number(result.metrics?.totalInvoiced ?? 0),
        pendingAmount: Number(result.metrics?.pendingAmount ?? 0),
        paidAmount: Number(result.metrics?.paidAmount ?? 0),
        overdueAmount: Number(result.metrics?.overdueAmount ?? 0),
        cancelledAmount: Number(result.metrics?.cancelledAmount ?? 0),
        overdueCount: Number(result.metrics?.overdueCount ?? 0),
      });

      if (
        nextPagination.totalPages > 0 &&
        currentPage > nextPagination.totalPages
      ) {
        setCurrentPage(nextPagination.totalPages);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las facturas pendientes");
      setInvoices([]);
      setPagination({ page: 1, pageSize, totalItems: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoices();
  }, [
    currentPage,
    pageSize,
    search,
    status,
    dateFrom,
    dateTo,
    sortKey,
    sortDirection,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, search, status, dateFrom, dateTo, sortKey, sortDirection]);

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

    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [isColumnMenuOpen]);

  function handleSortChange(nextSortKey: PaymentSortKey) {
    setSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );
        return currentSortKey;
      }

      setSortDirection(
        ["total", "paid", "balance"].includes(nextSortKey) ? "desc" : "asc",
      );
      return nextSortKey;
    });
  }

  function handleSelectInvoice(invoice: FinanceInvoice) {
    setSelectedInvoice(invoice);
    setAmount(String(toSafeNumber(invoice.balance_amount)));
    setMethod("SINPE");
    setReferenceNumber("");
    setNotes("");
    setMessage("");
    setError("");
  }

  async function handleRegisterPayment() {
    if (!selectedInvoice) {
      setError("Seleccioná una factura antes de registrar el pago.");
      return;
    }

    const parsedAmount = Number(amount);
    const balance = toSafeNumber(selectedInvoice.balance_amount);

    if (!parsedAmount || parsedAmount <= 0) {
      setError("El monto del pago debe ser mayor a cero.");
      return;
    }

    if (parsedAmount > balance) {
      setError("El monto del pago no puede ser mayor al saldo pendiente.");
      return;
    }

    setSavingPayment(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/invoice-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_id: selectedInvoice.invoice_id,
          amount: parsedAmount,
          method,
          reference_number: referenceNumber || null,
          notes: notes || null,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudo registrar el pago");
      }

      setMessage("Pago registrado correctamente.");
      setSelectedInvoice(null);
      setAmount("");
      setReferenceNumber("");
      setNotes("");

      await loadInvoices();
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el pago",
      );
    } finally {
      setSavingPayment(false);
    }
  }

  function toggleColumn(columnKey: OptionalColumnKey) {
    setVisibleColumns((current) => ({
      ...current,
      [columnKey]: !current[columnKey],
    }));
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Pagos"
          title="Pagos pendientes"
          description="Facturas con saldo pendiente que requieren pagos parciales o completos."
        />

        <button
          type="button"
          onClick={loadInvoices}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FinanceSummaryCard
          label="Facturas abiertas"
          value={String(pagination.totalItems)}
          helper="Con saldo pendiente"
        />

        <FinanceSummaryCard
          label="Saldo pendiente"
          value={formatCurrency(metrics.pendingAmount, summaryCurrency)}
          helper="Por cobrar"
        />

        <FinanceSummaryCard
          label="Vencido"
          value={formatCurrency(metrics.overdueAmount, summaryCurrency)}
          helper="Monto vencido"
        />
      </div>

      {message && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 xl:grid-cols-[1.3fr_220px_160px_160px_150px_145px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, factura, teléfono o servicio..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PaymentStatusFilter)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300"
            title="Desde"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300"
            title="Hasta"
          />

          <div ref={columnMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsColumnMenuOpen((current) => !current)}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Columnas
            </button>

            <ColumnPicker
              isOpen={isColumnMenuOpen}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
          </div>

          <label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
            Ver
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
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
      </div>

      {selectedInvoice && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Registrar pago
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-950">
                {selectedInvoice.invoice_number || "Factura sin número"}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {getClientName(selectedInvoice.client)} · Saldo pendiente:{" "}
                <span className="font-semibold text-slate-900">
                  {formatCurrency(
                    selectedInvoice.balance_amount,
                    getInvoiceCurrency(selectedInvoice),
                  )}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Monto del pago
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">
                Método de pago
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="CASH">Efectivo</option>
                <option value="SINPE">SINPE</option>
                <option value="BANK_TRANSFER">Transferencia bancaria</option>
                <option value="CARD">Tarjeta</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">
                Número de referencia
              </label>
              <input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">
                Notas
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Opcional"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegisterPayment}
            disabled={savingPayment}
            className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPayment ? "Registrando pago..." : "Registrar pago"}
          </button>
        </div>
      )}

      {loading && invoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando facturas pendientes...
          </p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No hay facturas con saldo pendiente.
          </p>
        </div>
      ) : (
        <section className="mt-6 min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <div
                style={{ gridTemplateColumns }}
                className="grid border-b border-slate-200 bg-slate-50"
              >
                {displayedColumns.map((column) => (
                  <SortableHeader
                    key={column}
                    columnKey={column}
                    label={COLUMN_LABELS[column]}
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    align={
                      column === "total" ||
                      column === "paid" ||
                      column === "balance"
                        ? "right"
                        : column === "status" || column === "action"
                          ? "center"
                          : "left"
                    }
                    onSortChange={handleSortChange}
                  />
                ))}
              </div>

              <ul className="divide-y divide-slate-100">
                {invoices.map((invoice) => {
                  const invoiceCurrency = getInvoiceCurrency(invoice);
                  const clientName =
                    invoice.customer_snapshot_name ||
                    getClientName(invoice.client) ||
                    "-";

                  return (
                    <li
                      key={invoice.invoice_id}
                      style={{ gridTemplateColumns }}
                      className="grid min-h-[74px] bg-white transition hover:bg-blue-50/70"
                    >
                      {displayedColumns.map((column) => {
                        if (column === "invoice") {
                          return (
                            <div
                              key={column}
                              className="min-w-0 border-r border-slate-100 px-4 py-3"
                            >
                              <p
                                title={invoice.invoice_number || "Sin número"}
                                className="truncate text-sm font-black text-slate-950"
                              >
                                {invoice.invoice_number || "Sin número"}
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
                                title={
                                  invoice.customer_snapshot_phone ||
                                  invoice.client?.phone_primary ||
                                  ""
                                }
                                className="mt-1 truncate text-xs font-medium text-slate-500"
                              >
                                {invoice.customer_snapshot_phone ||
                                  invoice.client?.phone_primary ||
                                  "Sin teléfono"}
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
                              <span className="truncate text-sm font-semibold text-slate-700">
                                {formatDateLabel(invoice.invoice_date)}
                              </span>
                            </div>
                          );
                        }

                        if (column === "dueDate") {
                          const dueLabel = getDueLabel(invoice);

                          return (
                            <div
                              key={column}
                              className="flex min-w-0 items-center border-r border-slate-100 px-4 py-3"
                            >
                              <span
                                title={dueLabel}
                                className={`truncate text-sm font-semibold ${
                                  invoice.status === "OVERDUE"
                                    ? "text-red-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {dueLabel}
                              </span>
                            </div>
                          );
                        }

                        if (column === "total") {
                          return (
                            <div
                              key={column}
                              className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                            >
                              <span className="truncate text-sm font-black text-slate-900">
                                {formatCurrency(
                                  invoice.total_amount,
                                  invoiceCurrency,
                                )}
                              </span>
                            </div>
                          );
                        }

                        if (column === "paid") {
                          return (
                            <div
                              key={column}
                              className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                            >
                              <span className="truncate text-sm font-bold text-slate-800">
                                {formatCurrency(
                                  invoice.paid_amount,
                                  invoiceCurrency,
                                )}
                              </span>
                            </div>
                          );
                        }

                        if (column === "balance") {
                          return (
                            <div
                              key={column}
                              className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                            >
                              <span className="truncate text-sm font-black text-slate-950">
                                {formatCurrency(
                                  invoice.balance_amount,
                                  invoiceCurrency,
                                )}
                              </span>
                            </div>
                          );
                        }

                        if (column === "status") {
                          return (
                            <div
                              key={column}
                              className="flex min-w-0 items-center justify-center border-r border-slate-100 px-4 py-3"
                            >
                              <span
                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getInvoiceStatusClass(invoice.status)}`}
                              >
                                {getInvoiceStatusLabel(invoice.status)}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={column}
                            className="flex min-w-0 items-center justify-center px-4 py-3"
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectInvoice(invoice)}
                              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                            >
                              Registrar pago
                            </button>
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
              Mostrando {pageRange.start}-{pageRange.end} de{" "}
              {pagination.totalItems} facturas · Página {safeCurrentPage} de{" "}
              {totalPages}
              {loading && invoices.length > 0 ? " · Actualizando..." : ""}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage <= 1}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))
                }
                disabled={safeCurrentPage >= totalPages}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <p className="font-bold">
          Solo se muestran facturas con saldo pendiente mayor a cero.
        </p>
        <p className="mt-1">
          Las facturas pagadas en su totalidad no se muestran en esta sección.
        </p>
      </div>
    </div>
  );
}
