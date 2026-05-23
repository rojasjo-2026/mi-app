"use client";

import type {
  ClientInvoice,
  ClientInvoiceFinanceSummary,
} from "@/lib/clients/clientInvoiceFinanceSummary";
import {
  formatCurrency,
  formatDateLabel,
} from "@/lib/clients/clientDetail.utils";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";
import { CommercialSummaryCard } from "@/components/clients/detail/CommercialSummaryCard";
import { MiniInfoCard } from "@/components/clients/detail/MiniInfoCard";

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

function formatInvoiceDate(value?: string | Date | null, locale?: string) {
  if (!value) {
    return "-";
  }

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
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PARTIALLY_PAID":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "OVERDUE":
      return "bg-red-50 text-red-700 border-red-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-500 border-slate-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "PENDING":
    default:
      return "bg-orange-50 text-orange-700 border-orange-200";
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
  if (!summary.lastPayment) {
    return "Sin pagos";
  }

  return formatCurrency(summary.lastPayment.amount, currency, locale);
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

  return (
    <CollapsibleCard
      title="Facturas y pagos"
      rightContent={
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRefresh();
          }}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refrescar
        </button>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-medium text-slate-600">
            Cargando facturas...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <CommercialSummaryCard
              label="Facturado real"
              value={formatMoney(summary.totalInvoiced)}
              helper={`${summary.invoiceCount} factura${
                summary.invoiceCount === 1 ? "" : "s"
              } activa${summary.invoiceCount === 1 ? "" : "s"}`}
            />

            <CommercialSummaryCard
              label="Pagado real"
              value={formatMoney(summary.totalPaid)}
              helper="Pagos registrados"
            />

            <CommercialSummaryCard
              label="Saldo pendiente"
              value={formatMoney(summary.pendingBalance)}
              helper={`${summary.pendingInvoiceCount} pendiente${
                summary.pendingInvoiceCount === 1 ? "" : "s"
              }`}
            />

            <CommercialSummaryCard
              label="Vencido"
              value={formatMoney(summary.overdueBalance)}
              helper={`${summary.overdueInvoiceCount} factura${
                summary.overdueInvoiceCount === 1 ? "" : "s"
              } vencida${summary.overdueInvoiceCount === 1 ? "" : "s"}`}
            />

            <CommercialSummaryCard
              label="Último pago"
              value={getLastPaymentLabel(summary, currency, locale)}
              helper={
                summary.lastPayment
                  ? formatInvoiceDate(
                      summary.lastPayment.payment_date ??
                        summary.lastPayment.created_at,
                      locale,
                    )
                  : "Sin pagos registrados"
              }
            />
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                Historial de facturas
              </h3>
            </div>

            {invoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Este cliente todavía no tiene facturas registradas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.invoice_id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {invoice.invoice_number || "Sin número"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getInvoiceStatusClass(
                              invoice.status,
                            )}`}
                          >
                            {getInvoiceStatusLabel(invoice.status)}
                          </span>

                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {invoice.source_type || "MANUAL"}
                          </span>
                        </div>

                        <p className="truncate text-sm font-bold text-slate-900">
                          {getInvoiceDescription(invoice)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Factura:{" "}
                          {formatInvoiceDate(invoice.invoice_date, locale)} ·
                          Vence: {formatInvoiceDate(invoice.due_date, locale)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
                        <MiniInfoCard
                          label="Total"
                          value={formatMoney(
                            invoice.total_amount,
                            invoice.currency,
                          )}
                        />
                        <MiniInfoCard
                          label="Pagado"
                          value={formatMoney(
                            invoice.paid_amount,
                            invoice.currency,
                          )}
                        />
                        <MiniInfoCard
                          label="Saldo"
                          value={formatMoney(
                            invoice.balance_amount,
                            invoice.currency,
                          )}
                        />
                        <MiniInfoCard
                          label="Pagos"
                          value={String(invoice.payments?.length ?? 0)}
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
