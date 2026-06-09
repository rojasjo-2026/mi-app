"use client";

import { useState } from "react";
import type { FinanceInvoice } from "../../types";
import {
  formatCurrency,
  formatDateLabel,
  getClientName,
  getInvoiceCurrency,
  getInvoiceOrigin,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from "../../utils";
import type { PaymentMethod } from "./paymentsSectionConfig";

type PaymentRegisterFormProps = {
  invoice: FinanceInvoice;
  amount: string;
  method: PaymentMethod;
  referenceNumber: string;
  notes: string;
  savingPayment: boolean;
  onAmountChange: (value: string) => void;
  onMethodChange: (value: PaymentMethod) => void;
  onReferenceNumberChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function PaymentRegisterForm({
  invoice,
  amount,
  method,
  referenceNumber,
  notes,
  savingPayment,
  onAmountChange,
  onMethodChange,
  onReferenceNumberChange,
  onNotesChange,
  onClose,
  onSubmit,
}: PaymentRegisterFormProps) {
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

  const invoiceCurrency = getInvoiceCurrency(invoice);
  const invoiceNumber = invoice.invoice_number || "Factura sin número";
  const clientName = getClientName(invoice.client) || "-";

  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Registrar pago
          </p>

          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            {invoiceNumber}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {clientName} · Saldo pendiente:{" "}
            <span className="font-semibold text-slate-900">
              {formatCurrency(invoice.balance_amount, invoiceCurrency)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowInvoiceDetail((current) => !current)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {showInvoiceDetail ? "Ocultar factura" : "Ver factura"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>

      {showInvoiceDetail && (
        <div className="mb-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Cliente
            </p>
            <p className="mt-1 truncate font-semibold text-slate-900">
              {clientName}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Fecha
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatDateLabel(invoice.invoice_date)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Vence
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatDateLabel(invoice.due_date)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Estado
            </p>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getInvoiceStatusClass(
                invoice.status,
              )}`}
            >
              {getInvoiceStatusLabel(invoice.status)}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Total
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatCurrency(invoice.total_amount, invoiceCurrency)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Pagado
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatCurrency(invoice.paid_amount, invoiceCurrency)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Saldo
            </p>
            <p className="mt-1 font-semibold text-red-700">
              {formatCurrency(invoice.balance_amount, invoiceCurrency)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Origen
            </p>
            <p className="mt-1 truncate font-semibold text-slate-900">
              {getInvoiceOrigin(invoice)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium text-slate-600">
            Monto del pago
          </label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">
            Método de pago
          </label>
          <select
            value={method}
            onChange={(event) =>
              onMethodChange(event.target.value as PaymentMethod)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
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
            onChange={(event) => onReferenceNumberChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Notas</label>
          <input
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            placeholder="Opcional"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={savingPayment}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {savingPayment ? "Registrando pago..." : "Registrar pago"}
      </button>
    </div>
  );
}
