"use client";

import { ReceiptText } from "lucide-react";
import type {
  ClientInvoice,
  ClientInvoiceFinanceSummary,
} from "@/lib/clients/clientInvoiceFinanceSummary";
import {
  formatCurrency,
  formatDateLabel,
} from "@/lib/clients/clientDetail.utils";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";

type ClientFinanceHistorySectionProps = {
  invoices: ClientInvoice[];
  summary: ClientInvoiceFinanceSummary;
  loading: boolean;
  error: string;
  isOpen: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  currency?: string | null;
  locale?: string;
};

type FinanceMetricProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "success" | "warning" | "danger";
};

function formatInvoiceDate(value?: string | Date | null, locale?: string) {
  if (!value) return "-";
  return formatDateLabel(String(value), locale);
}

function getInvoiceStatusLabel(status?: string | null) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "PENDING":
      return "Pendiente";
    case "PARTIALLY_PAID":
      return "Parcial";
    case "PAID":
      return "Pagada";
    case "OVERDUE":
      return "Vencida";
    case "CANCELLED":
      return "Cancelada";
    default:
      return "Sin estado";
  }
}

function getInvoiceStatusClass(status?: string | null) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "PARTIALLY_PAID":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "OVERDUE":
      return "bg-red-50 text-red-700 ring-red-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-500 ring-slate-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "PENDING":
    default:
      return "bg-orange-50 text-orange-700 ring-orange-200";
  }
}

function getInvoiceDescription(invoice: ClientInvoice) {
  return (
    invoice.service_snapshot_description ||
    invoice.installation?.description ||
    invoice.follow_up?.reason ||
    "Servicio facturado"
  );
}

function getLastPaymentLabel(
  summary: ClientInvoiceFinanceSummary,
  currency?: string | null,
  locale?: string,
) {
  if (!summary.lastPayment) return "Sin pagos";
  return formatCurrency(summary.lastPayment.amount, currency, locale);
}

function FinanceMetric({
  label,
  value,
  helper,
  tone = "default",
}: FinanceMetricProps) {
  const valueClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-orange-600"
        : tone === "danger"
          ? "text-red-600"
          : "text-slate-950";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className={`mt-2 text-xl font-black ${valueClass}`}>{value}</p>

      <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
    </div>
  );
}

export function ClientFinanceHistorySection({
  invoices,
  summary,
  loading,
  error,
  isOpen,
  onToggle,
  onRefresh,
  currency,
  locale,
}: ClientFinanceHistorySectionProps) {
  const formatMoney = (
    value?: number | string | null,
    invoiceCurrency?: string | null,
  ) => formatCurrency(value, invoiceCurrency ?? currency, locale);

  const hasInvoices = invoices.length > 0;
  const hasOverdue = summary.overdueBalance > 0;

  return (
    <CollapsibleCard
      title="Facturas y pagos"
      description="Historial de facturación, pagos y saldos del cliente."
      icon={<ReceiptText className="h-5 w-5" />}
      rightContent={
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRefresh();
          }}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refrescar
        </button>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6">
          <p className="text-sm font-semibold text-slate-600">
            Cargando facturas...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FinanceMetric
              label="Facturado real"
              value={formatMoney(summary.totalInvoiced)}
              helper={`${summary.invoiceCount} factura${
                summary.invoiceCount === 1 ? "" : "s"
              } activa${summary.invoiceCount === 1 ? "" : "s"}`}
            />

            <FinanceMetric
              label="Pagado real"
              value={formatMoney(summary.totalPaid)}
              helper="Pagos registrados"
              tone="success"
            />

            <FinanceMetric
              label="Saldo pendiente"
              value={formatMoney(summary.pendingBalance)}
              helper={`${summary.pendingInvoiceCount} pendiente${
                summary.pendingInvoiceCount === 1 ? "" : "s"
              }`}
              tone={summary.pendingBalance > 0 ? "warning" : "default"}
            />

            <FinanceMetric
              label={hasOverdue ? "Vencido" : "Último pago"}
              value={
                hasOverdue
                  ? formatMoney(summary.overdueBalance)
                  : getLastPaymentLabel(summary, currency, locale)
              }
              helper={
                hasOverdue
                  ? `${summary.overdueInvoiceCount} factura${
                      summary.overdueInvoiceCount === 1 ? "" : "s"
                    } vencida${summary.overdueInvoiceCount === 1 ? "" : "s"}`
                  : summary.lastPayment
                    ? formatInvoiceDate(
                        summary.lastPayment.payment_date ??
                          summary.lastPayment.created_at,
                        locale,
                      )
                    : "Sin pagos registrados"
              }
              tone={hasOverdue ? "danger" : "default"}
            />
          </div>

          <div className="mt-5">
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-slate-400">
              Historial de facturas
            </h3>

            {!hasInvoices ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-6 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Sin facturas registradas.
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Cuando existan facturas, pagos o saldos, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.invoice_id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                            {invoice.invoice_number || "Sin número"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${getInvoiceStatusClass(
                              invoice.status,
                            )}`}
                          >
                            {getInvoiceStatusLabel(invoice.status)}
                          </span>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                            {invoice.source_type || "MANUAL"}
                          </span>
                        </div>

                        <p className="truncate text-sm font-black text-slate-900">
                          {getInvoiceDescription(invoice)}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Factura:{" "}
                          {formatInvoiceDate(invoice.invoice_date, locale)}
                          {" · "}
                          Vence: {formatInvoiceDate(invoice.due_date, locale)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
                        <FinanceMetric
                          label="Total"
                          value={formatMoney(
                            invoice.total_amount,
                            invoice.currency,
                          )}
                          helper="Factura"
                        />

                        <FinanceMetric
                          label="Pagado"
                          value={formatMoney(
                            invoice.paid_amount,
                            invoice.currency,
                          )}
                          helper="Registrado"
                          tone="success"
                        />

                        <FinanceMetric
                          label="Saldo"
                          value={formatMoney(
                            invoice.balance_amount,
                            invoice.currency,
                          )}
                          helper="Pendiente"
                        />

                        <FinanceMetric
                          label="Pagos"
                          value={String(invoice.payments?.length ?? 0)}
                          helper="Movimientos"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </CollapsibleCard>
  );
}
