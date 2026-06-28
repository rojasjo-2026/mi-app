"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import type { FinanceInvoice } from "../types";
import { getInvoiceCurrency, toSafeNumber } from "../utils";
import SectionHeader from "./SectionHeader";
import {
  DEFAULT_VISIBLE_COLUMNS,
  OPTIONAL_COLUMNS,
  type ColumnKey,
  type InvoicesApiResponse,
  type InvoiceMetrics,
  type OptionalColumnKey,
  type PaginationState,
  type PaymentMethod,
  type PaymentSortKey,
  type PaymentStatusFilter,
  type SortDirection,
  type VisibleColumns,
} from "./payments/paymentsSectionConfig";
import { getGridTemplate } from "./payments/paymentsSectionUtils";
import { PaymentSummaryCards } from "./payments/PaymentSummaryCards";
import { PaymentFiltersPanel } from "./payments/PaymentFiltersPanel";
import { PaymentRegisterForm } from "./payments/PaymentRegisterForm";
import { PaymentsTable } from "./payments/PaymentsTable";
import { PaymentsPagination } from "./payments/PaymentsPagination";
import { PaymentInfoNote } from "./payments/PaymentInfoNote";

const DEFAULT_PAYMENT_PAGE_SIZE = 15;

export default function PaymentsSection() {
  const { currency: businessCurrency } = useAppSettings();

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
  const [pageSize, setPageSize] = useState(DEFAULT_PAYMENT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<PaymentSortKey>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAYMENT_PAGE_SIZE,
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
    invoices.find((invoice) => invoice.currency)?.currency ?? businessCurrency;

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

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setCurrentPage(1);
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
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <PaymentSummaryCards
        totalItems={pagination.totalItems}
        metrics={metrics}
        summaryCurrency={summaryCurrency}
      />

      {message && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <PaymentFiltersPanel
        search={search}
        status={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
        pageSize={pageSize}
        isColumnMenuOpen={isColumnMenuOpen}
        columnMenuRef={columnMenuRef}
        visibleColumns={visibleColumns}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onPageSizeChange={handlePageSizeChange}
        onToggleColumnMenu={() => setIsColumnMenuOpen((current) => !current)}
        onToggleColumn={toggleColumn}
      />

      {selectedInvoice && (
        <PaymentRegisterForm
          invoice={selectedInvoice}
          amount={amount}
          method={method}
          referenceNumber={referenceNumber}
          notes={notes}
          savingPayment={savingPayment}
          onAmountChange={setAmount}
          onMethodChange={setMethod}
          onReferenceNumberChange={setReferenceNumber}
          onNotesChange={setNotes}
          onClose={() => setSelectedInvoice(null)}
          onSubmit={handleRegisterPayment}
        />
      )}

      {loading && invoices.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando facturas pendientes...
          </p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No hay facturas con saldo pendiente.
          </p>
        </div>
      ) : (
        <>
          <PaymentsTable
            invoices={invoices}
            displayedColumns={displayedColumns}
            gridTemplateColumns={gridTemplateColumns}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onSelectInvoice={handleSelectInvoice}
          />

          <PaymentsPagination
            pagination={pagination}
            loading={loading}
            invoicesLength={invoices.length}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <PaymentInfoNote />
    </div>
  );
}
