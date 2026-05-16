"use client";

import { useEffect, useMemo, useState } from "react";
import type { FinanceInvoice } from "../types";
import {
  formatCurrency,
  formatDateLabel,
  getClientName,
  getInvoiceOrigin,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
  toSafeNumber,
} from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import MiniAmountCard from "./MiniAmountCard";
import SectionHeader from "./SectionHeader";

type PaymentMethod = "CASH" | "SINPE" | "BANK_TRANSFER" | "CARD" | "OTHER";

export default function PaymentsSection() {
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("SINPE");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  async function loadInvoices() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invoices", {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudieron cargar las facturas");
      }

      setInvoices(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las facturas pendientes");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const payableInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const balance = toSafeNumber(invoice.balance_amount);

      return (
        balance > 0 &&
        invoice.status !== "PAID" &&
        invoice.status !== "CANCELLED"
      );
    });
  }, [invoices]);

  const summary = useMemo(() => {
    const pendingAmount = payableInvoices.reduce(
      (total, invoice) => total + toSafeNumber(invoice.balance_amount),
      0,
    );

    const overdueAmount = payableInvoices
      .filter((invoice) => invoice.status === "OVERDUE")
      .reduce(
        (total, invoice) => total + toSafeNumber(invoice.balance_amount),
        0,
      );

    const partialAmount = payableInvoices
      .filter((invoice) => invoice.status === "PARTIALLY_PAID")
      .reduce(
        (total, invoice) => total + toSafeNumber(invoice.balance_amount),
        0,
      );

    return {
      count: payableInvoices.length,
      pendingAmount,
      overdueAmount,
      partialAmount,
    };
  }, [payableInvoices]);

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
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo registrar el pago");
    } finally {
      setSavingPayment(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Pagos"
          title="Registro de pagos"
          description="Consulta facturas con saldo pendiente y registra pagos parciales o completos."
        />

        <button
          type="button"
          onClick={loadInvoices}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FinanceSummaryCard
          label="Facturas abiertas"
          value={String(summary.count)}
          helper="Con saldo pendiente"
        />

        <FinanceSummaryCard
          label="Saldo pendiente"
          value={formatCurrency(summary.pendingAmount)}
          helper="Por cobrar"
        />

        <FinanceSummaryCard
          label="Vencido"
          value={formatCurrency(summary.overdueAmount)}
          helper="Facturas vencidas"
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
                  {formatCurrency(selectedInvoice.balance_amount)}
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      {loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando facturas pendientes...
          </p>
        </div>
      ) : payableInvoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No hay facturas con saldo pendiente.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {payableInvoices.map((invoice) => (
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
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

                  <button
                    type="button"
                    onClick={() => handleSelectInvoice(invoice)}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Registrar pago
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
