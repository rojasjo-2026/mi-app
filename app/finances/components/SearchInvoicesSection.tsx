"use client";

import { useMemo, useState } from "react";
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

export default function SearchInvoicesSection() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status) {
        params.set("status", status);
      }

      const query = params.toString();

      const res = await fetch(`/api/invoices${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudieron buscar las facturas");
      }

      setInvoices(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron buscar las facturas");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const totalAmount = invoices
      .filter((invoice) => invoice.status !== "CANCELLED")
      .reduce(
        (total, invoice) => total + toSafeNumber(invoice.total_amount),
        0,
      );

    const balanceAmount = invoices
      .filter((invoice) => invoice.status !== "CANCELLED")
      .reduce(
        (total, invoice) => total + toSafeNumber(invoice.balance_amount),
        0,
      );

    const paidAmount = invoices.reduce(
      (total, invoice) => total + toSafeNumber(invoice.paid_amount),
      0,
    );

    return {
      count: invoices.length,
      totalAmount,
      balanceAmount,
      paidAmount,
    };
  }, [invoices]);

  return (
    <div>
      <SectionHeader
        eyebrow="Buscar facturas"
        title="Búsqueda avanzada de facturas"
        description="Busque facturas por cliente, teléfono, cédula, correo o número de factura."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_140px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Buscar por nombre, teléfono, cédula, correo o número de factura..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="ALL">Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="PARTIALLY_PAID">Parcialmente pagado</option>
          <option value="PAID">Pagado</option>
          <option value="OVERDUE">Vencido</option>
          <option value="CANCELLED">Cancelado</option>
        </select>

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <FinanceSummaryCard
          label="Resultados"
          value={String(summary.count)}
          helper="Facturas encontradas"
        />

        <FinanceSummaryCard
          label="Total"
          value={formatCurrency(summary.totalAmount)}
          helper="Monto facturado"
        />

        <FinanceSummaryCard
          label="Pagado"
          value={formatCurrency(summary.paidAmount)}
          helper="Pagos registrados"
        />

        <FinanceSummaryCard
          label="Saldo"
          value={formatCurrency(summary.balanceAmount)}
          helper="Pendiente de cobro"
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
            Buscando facturas...
          </p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Ingrese un criterio de búsqueda o presione Buscar para ver
            resultados.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
