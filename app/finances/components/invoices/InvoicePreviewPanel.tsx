import type { FinanceInvoice } from "../../types";
import {
  formatCurrency,
  formatDateLabel,
  formatPaymentMethod,
  formatPaymentTerm,
  getClientName,
  getInvoiceCurrency,
  getInvoiceOrigin,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
  toSafeNumber,
} from "../../utils";
import { DetailField } from "./DetailField";

export function InvoicePreviewPanel({
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
      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-semibold text-slate-800">
          Detalle de factura
        </p>
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
    <aside className="sticky top-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
          Detalle de factura
        </p>

        <h2
          title={invoiceNumber}
          className="mt-2 truncate text-lg font-semibold tracking-tight text-slate-950"
        >
          {invoiceNumber}
        </h2>

        <p
          title={clientName}
          className="mt-1 truncate text-sm font-semibold text-slate-600"
        >
          {clientName}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getInvoiceStatusClass(
              invoice.status,
            )}`}
          >
            {getInvoiceStatusLabel(invoice.status)}
          </span>

          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {invoiceCurrency}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Desglose</p>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(invoice.subtotal_amount, invoiceCurrency)}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Descuento</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(invoice.discount_amount, invoiceCurrency)}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Impuesto</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(invoice.tax_amount, invoiceCurrency)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {invoice.client?.client_id && (
            <a
              href={`/clients/${invoice.client.client_id}`}
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Ver cliente
            </a>
          )}

          {invoice.installation?.installation_id && (
            <a
              href={`/installations/${invoice.installation.installation_id}`}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver instalación
            </a>
          )}

          {invoice.follow_up?.follow_up_id && (
            <a
              href={`/follow-ups/${invoice.follow_up.follow_up_id}`}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver mantenimiento
            </a>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => onCancelInvoice(invoice)}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Cancelando..." : "Cancelar factura"}
            </button>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
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
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
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
