"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import type { FinanceInvoice } from "../types";
import {
  formatCurrency,
  formatDateLabel,
  getClientName,
  getInvoiceCurrency,
  getInvoiceOrigin,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import SectionHeader from "./SectionHeader";
import {
  INITIAL_VISIBLE_INVOICE_COLUMNS,
  INVOICE_COLUMN_CONFIG,
  OPTIONAL_INVOICE_COLUMNS,
  PAGE_SIZE_OPTIONS,
  STATUS_OPTIONS,
  type InvoiceColumnKey,
  type InvoiceStatusFilter,
  type InvoicesSectionProps,
  type OptionalInvoiceColumnKey,
  type VisibleInvoiceColumns,
} from "./invoices/invoicesSectionConfig";
import { SortableHeader } from "./invoices/SortableHeader";
import { InvoiceColumnPicker } from "./invoices/InvoiceColumnPicker";
import { InvoicePreviewPanel } from "./invoices/InvoicePreviewPanel";

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
  const { currency: businessCurrency } = useAppSettings();

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
    invoices.find((invoice) => invoice.currency)?.currency ?? businessCurrency;

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
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {metrics.overdueAmount > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-red-600">
            !
          </span>

          <p className="font-medium">
            <span className="font-semibold">
              {metrics.overdueCount} factura
              {metrics.overdueCount === 1 ? "" : "s"} vencida
              {metrics.overdueCount === 1 ? "" : "s"}
            </span>{" "}
            · Cobro urgente: saldo vencido total{" "}
            <span className="font-semibold">
              {formatCurrency(metrics.overdueAmount, summaryCurrency)}
            </span>
            .
          </p>
        </div>
      )}

      {notification && (
        <div
          className={`mt-5 rounded-lg border px-4 py-3 text-sm font-medium ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
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
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr_0.55fr_0.55fr_0.45fr_0.45fr]">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por factura, cliente, teléfono, servicio o cédula"
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />

          <select
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as InvoiceStatusFilter)
            }
            title="Filtrar por estado"
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Desde
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
              className="mt-0.5 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
            />
          </label>

          <label className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Hasta
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
              className="mt-0.5 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
            />
          </label>

          <div ref={columnMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsColumnMenuOpen((current) => !current)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Columnas
            </button>

            <InvoiceColumnPicker
              isOpen={isColumnMenuOpen}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
          </div>

          <label className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
            Ver
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="bg-transparent text-sm font-semibold outline-none"
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
            <span className="rounded-md bg-slate-50 px-3 py-1 text-slate-600">
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
              className="rounded-md border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Limpiar fechas
            </button>
          </div>
        )}
      </div>

      {loading && invoices.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando facturas...
          </p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Todavía no hay facturas con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                        className={`grid min-h-[62px] cursor-pointer transition hover:bg-blue-50/70 ${
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
                                className="flex min-w-0 items-center border-r border-slate-100 px-3 py-2.5"
                              >
                                <span
                                  title={invoice.invoice_number || "Sin número"}
                                  className="truncate text-sm font-semibold text-slate-950"
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
                                className="min-w-0 border-r border-slate-100 px-3 py-2.5"
                              >
                                <p
                                  title={clientName}
                                  className="truncate text-sm font-semibold text-slate-900"
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
                                className="flex min-w-0 items-center border-r border-slate-100 px-3 py-2.5"
                              >
                                <span
                                  title={formatDateLabel(invoice.invoice_date)}
                                  className="truncate text-sm font-medium text-slate-700"
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
                                className="flex min-w-0 items-center border-r border-slate-100 px-3 py-2.5"
                              >
                                <span
                                  title={formatDateLabel(invoice.due_date)}
                                  className="truncate text-sm font-medium text-slate-700"
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
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-3 py-2.5"
                              >
                                <span
                                  title={totalLabel}
                                  className="truncate text-sm font-semibold text-slate-900"
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
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-3 py-2.5"
                              >
                                <span
                                  title={paidLabel}
                                  className="truncate text-sm font-semibold text-emerald-700"
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
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-3 py-2.5"
                              >
                                <span
                                  title={balanceLabel}
                                  className="truncate text-sm font-semibold text-red-700"
                                >
                                  {balanceLabel}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={column}
                              className="flex min-w-0 items-center justify-center px-3 py-2.5"
                            >
                              <span
                                title={getInvoiceStatusLabel(invoice.status)}
                                className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${getInvoiceStatusClass(invoice.status)}`}
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

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-500">
                Mostrando {pageStartIndex}-{pageEndIndex} de {visibleTotal}{" "}
                facturas · Página {safeCurrentPage} de {totalPages}
                {loading && invoices.length > 0 ? " · Actualizando..." : ""}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onPageChange(Math.min(totalPages, safeCurrentPage + 1))
                  }
                  disabled={safeCurrentPage >= totalPages}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
