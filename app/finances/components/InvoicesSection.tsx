"use client";

import { useMemo, useState } from "react";
import type { FinanceInvoice } from "../types";
import {
  formatCurrency,
  formatDateLabel,
  formatPaymentMethod,
  formatPaymentTerm,
  getBillingStatusLabel,
  getClientName,
  getInvoiceOrigin,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
  toSafeNumber,
} from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import MiniAmountCard from "./MiniAmountCard";
import SectionHeader from "./SectionHeader";

type InvoicesSectionProps = {
  invoices: FinanceInvoice[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

export default function InvoicesSection({
  invoices,
  loading,
  error,
  onRefresh,
}: InvoicesSectionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);
  const [submittingInvoiceId, setSubmittingInvoiceId] = useState<string | null>(
    null,
  );

  const cancelableStatuses = new Set<string>(["PENDING", "OVERDUE"]);

  const canCancelInvoice = (invoice: FinanceInvoice) => {
    const status = invoice.status ?? "";

    return (
      cancelableStatuses.has(status) && toSafeNumber(invoice.paid_amount) === 0
    );
  };

  const handleCancelInvoice = async (invoice: FinanceInvoice) => {
    if (!canCancelInvoice(invoice)) {
      return;
    }

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

    if (!confirmed) {
      return;
    }

    const reason = window.prompt("Ingrese el motivo de la cancelación", "");

    if (reason === null) {
      return;
    }

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
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo cancelar la factura.",
      });
    } finally {
      setSubmittingInvoiceId(null);
    }
  };

  const toggleExpand = (invoiceId: string) => {
    if (!invoiceId) {
      return;
    }

    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(invoiceId)) {
        next.delete(invoiceId);
      } else {
        next.add(invoiceId);
      }

      return next;
    });
  };

  const invoiceSummary = useMemo(() => {
    const totalInvoiced = invoices
      .filter((invoice) => invoice.status !== "CANCELLED")
      .reduce(
        (total, invoice) => total + toSafeNumber(invoice.total_amount),
        0,
      );

    const pendingAmount = invoices
      .filter(
        (invoice) =>
          invoice.status === "PENDING" ||
          invoice.status === "PARTIALLY_PAID" ||
          invoice.status === "OVERDUE",
      )
      .reduce(
        (total, invoice) => total + toSafeNumber(invoice.balance_amount),
        0,
      );

    const paidAmount = invoices.reduce(
      (total, invoice) => total + toSafeNumber(invoice.paid_amount),
      0,
    );

    const overdueAmount = invoices
      .filter((invoice) => invoice.status === "OVERDUE")
      .reduce(
        (total, invoice) => total + toSafeNumber(invoice.balance_amount),
        0,
      );

    const cancelledAmount = invoices
      .filter((invoice) => invoice.status === "CANCELLED")
      .reduce(
        (total, invoice) => total + toSafeNumber(invoice.total_amount),
        0,
      );

    const overdueCount = invoices.filter(
      (invoice) => invoice.status === "OVERDUE",
    ).length;

    return {
      totalInvoiced,
      pendingAmount,
      paidAmount,
      overdueAmount,
      cancelledAmount,
      overdueCount,
    };
  }, [invoices]);

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
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      {invoiceSummary.overdueAmount > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">
            {invoiceSummary.overdueCount} factura
            {invoiceSummary.overdueCount === 1 ? "" : "s"} vencida
            {invoiceSummary.overdueCount === 1 ? "" : "s"}.
          </p>
          <p className="mt-1">
            Cobro urgente: saldo vencido total{" "}
            {formatCurrency(invoiceSummary.overdueAmount)}.
          </p>
        </div>
      )}

      {notification && (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${
            {
              success: "border-emerald-200 bg-emerald-50 text-emerald-700",
              error: "border-red-200 bg-red-50 text-red-700",
            }[notification.type]
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FinanceSummaryCard
          label="Total facturado"
          value={formatCurrency(invoiceSummary.totalInvoiced)}
          helper="Todas las facturas"
        />

        <FinanceSummaryCard
          label="Pendiente"
          value={formatCurrency(invoiceSummary.pendingAmount)}
          helper="Pendiente de cobro"
        />

        <FinanceSummaryCard
          label="Pagado"
          value={formatCurrency(invoiceSummary.paidAmount)}
          helper="Pagos recibidos"
        />

        <FinanceSummaryCard
          label="Vencido"
          value={formatCurrency(invoiceSummary.overdueAmount)}
          helper="Facturas vencidas"
        />

        <FinanceSummaryCard
          label="Cancelado"
          value={formatCurrency(invoiceSummary.cancelledAmount)}
          helper="Facturas canceladas"
        />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando facturas...
          </p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Todavía no hay facturas registradas.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {invoices.map((invoice, index) => {
            const invoiceId =
              typeof invoice.invoice_id === "string" ? invoice.invoice_id : "";

            const isExpanded = invoiceId ? expandedIds.has(invoiceId) : false;

            const isSubmittingCancellation =
              invoiceId !== "" && submittingInvoiceId === invoiceId;

            return (
              <div
                key={invoiceId || invoice.invoice_number || index}
                className={`rounded-2xl border p-4 ${
                  invoice.status === "OVERDUE"
                    ? "border-red-300 bg-red-50/80 shadow-sm"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                {/* Header */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {invoice.invoice_number || "Sin número"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClass(
                          invoice.status,
                        )}`}
                      >
                        {getInvoiceStatusLabel(invoice.status)}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900">
                      {getClientName(invoice.client)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {getInvoiceOrigin(invoice)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Fecha: {formatDateLabel(invoice.invoice_date)} · Vence:{" "}
                      {formatDateLabel(invoice.due_date)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                    <MiniAmountCard
                      label="Total"
                      value={formatCurrency(invoice.total_amount)}
                    />

                    <MiniAmountCard
                      label="Pagado"
                      value={formatCurrency(invoice.paid_amount)}
                    />

                    <MiniAmountCard
                      label="Saldo"
                      value={formatCurrency(invoice.balance_amount)}
                    />
                  </div>
                </div>

                {/* Expand Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (invoiceId) {
                        toggleExpand(invoiceId);
                      }
                    }}
                    className="text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                  >
                    {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                </div>

                {/* Expandable Detail Section */}
                {isExpanded && (
                  <div className="mt-6 space-y-6 border-t border-slate-200 pt-6">
                    {/* General Information */}
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                        Información general
                      </h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-500">
                            Término de pago
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatPaymentTerm(invoice.payment_term)}
                          </p>
                        </div>

                        {invoice.credit_days !== null &&
                          invoice.credit_days !== undefined && (
                            <div className="rounded-lg bg-white p-3">
                              <p className="text-xs text-slate-500">
                                Días de crédito
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {invoice.credit_days}
                              </p>
                            </div>
                          )}

                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-500">Moneda</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {invoice.currency || "CRC"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-500">
                            Estado impuesto
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {invoice.tax_exempt ? "Exento" : "Aplicable"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Amount Breakdown */}
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                        Desglose de montos
                      </h4>

                      <div className="space-y-2 rounded-lg bg-white p-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(invoice.subtotal_amount)}
                          </span>
                        </div>

                        {toSafeNumber(invoice.discount_amount) > 0 && (
                          <div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">
                                Descuento
                                {invoice.discount_rate
                                  ? ` (${invoice.discount_rate}%)`
                                  : ""}
                              </span>
                              <span className="font-semibold text-slate-900">
                                -{formatCurrency(invoice.discount_amount)}
                              </span>
                            </div>

                            {invoice.discount_reason && (
                              <p className="text-xs text-slate-500">
                                Razón: {invoice.discount_reason}
                              </p>
                            )}
                          </div>
                        )}

                        {toSafeNumber(invoice.tax_amount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">
                              Impuesto
                              {invoice.tax_rate
                                ? ` (${invoice.tax_rate}%)`
                                : ""}
                            </span>
                            <span className="font-semibold text-slate-900">
                              +{formatCurrency(invoice.tax_amount)}
                            </span>
                          </div>
                        )}

                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-900">Total</span>
                            <span className="text-slate-900">
                              {formatCurrency(invoice.total_amount)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Pagado</span>
                            <span className="font-semibold text-emerald-700">
                              {formatCurrency(invoice.paid_amount)}
                            </span>
                          </div>

                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-slate-600">
                              Saldo pendiente
                            </span>
                            <span
                              className={`font-semibold ${
                                toSafeNumber(invoice.balance_amount) > 0
                                  ? "text-red-700"
                                  : "text-emerald-700"
                              }`}
                            >
                              {formatCurrency(invoice.balance_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Line Items */}
                    {invoice.lines && invoice.lines.length > 0 && (
                      <div>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                          Partidas
                        </h4>

                        <div className="overflow-x-auto rounded-lg bg-white">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                  Descripción
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                  Cantidad
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                  Precio unitario
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                  Total
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {invoice.lines.map((line) => (
                                <tr
                                  key={line.invoice_line_id}
                                  className="border-b border-slate-100"
                                >
                                  <td className="px-4 py-3 text-slate-900">
                                    {line.description || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-600">
                                    {toSafeNumber(line.quantity)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-600">
                                    {formatCurrency(line.unit_price)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                    {formatCurrency(line.total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Payment History */}
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                        Historial de pagos
                      </h4>

                      {!invoice.payments || invoice.payments.length === 0 ? (
                        <div className="rounded-lg bg-slate-50 p-4 text-center">
                          <p className="text-sm text-slate-500">
                            No hay pagos registrados
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {invoice.payments.map((payment) => (
                            <div
                              key={payment.payment_id}
                              className="rounded-lg bg-white p-4"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {formatCurrency(payment.amount)}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatPaymentMethod(payment.method)} ·{" "}
                                    {formatDateLabel(payment.payment_date)}
                                  </p>

                                  {payment.reference_number && (
                                    <p className="text-xs text-slate-500">
                                      Ref: {payment.reference_number}
                                    </p>
                                  )}

                                  {payment.notes && (
                                    <p className="mt-1 text-xs text-slate-600">
                                      Nota: {payment.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client Billing Information */}
                    {invoice.client && (
                      <div>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                          Información del cliente
                        </h4>

                        <div className="space-y-3 rounded-lg bg-white p-4">
                          <div>
                            <p className="text-xs text-slate-500">
                              Nombre facturación
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              {invoice.client.billing_name ||
                                getClientName(invoice.client) ||
                                "-"}
                            </p>
                          </div>

                          {invoice.client.billing_phone && (
                            <div>
                              <p className="text-xs text-slate-500">
                                Teléfono facturación
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {invoice.client.billing_phone}
                              </p>
                            </div>
                          )}

                          {invoice.client.billing_email && (
                            <div>
                              <p className="text-xs text-slate-500">
                                Correo facturación
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {invoice.client.billing_email}
                              </p>
                            </div>
                          )}

                          {invoice.client.tax_id && (
                            <div>
                              <p className="text-xs text-slate-500">
                                Cédula / ID fiscal
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {invoice.client.tax_id}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Related Work Item */}
                    {(invoice.installation || invoice.follow_up) && (
                      <div>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                          Trabajo relacionado
                        </h4>

                        <div className="rounded-lg bg-white p-4">
                          {invoice.installation && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase text-slate-600">
                                Instalación
                              </p>
                              <p className="text-sm text-slate-900">
                                {invoice.installation.description || "-"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Fecha:{" "}
                                {formatDateLabel(
                                  invoice.installation.installation_date,
                                )}
                              </p>
                              <p className="text-xs text-slate-500">
                                Estado:{" "}
                                {getBillingStatusLabel(
                                  invoice.installation.billing_status,
                                )}
                              </p>
                            </div>
                          )}

                          {invoice.follow_up && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase text-slate-600">
                                Mantenimiento
                              </p>
                              <p className="text-sm text-slate-900">
                                {invoice.follow_up.reason || "-"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Fecha:{" "}
                                {formatDateLabel(invoice.follow_up.target_date)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Estado:{" "}
                                {getBillingStatusLabel(
                                  invoice.follow_up.billing_status,
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {invoice.notes && (
                      <div>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                          Notas
                        </h4>

                        <div className="rounded-lg bg-white p-4">
                          <p className="whitespace-pre-wrap text-sm text-slate-700">
                            {invoice.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {canCancelInvoice(invoice) && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCancelInvoice(invoice)}
                          disabled={isSubmittingCancellation}
                          className="mt-4 inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmittingCancellation
                            ? "Cancelando..."
                            : "Cancelar factura"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
