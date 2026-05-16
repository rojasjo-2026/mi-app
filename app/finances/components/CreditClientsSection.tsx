"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatCurrency,
  formatDateLabel,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import MiniAmountCard from "./MiniAmountCard";
import SectionHeader from "./SectionHeader";

type CreditClientInvoice = {
  invoice_id: string;
  invoice_number?: string | null;
  status?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  total_amount?: number | string | null;
  paid_amount?: number | string | null;
  balance_amount?: number | string | null;
};

type CreditClientItem = {
  client_id: string;
  client_name: string;
  phone?: string | null;
  email?: string | null;
  tax_id?: string | null;
  default_payment_term?: string | null;
  default_credit_days?: number | null;
  credit_limit?: number | string | null;
  has_credit_terms?: boolean;
  invoice_count: number;
  pending_amount: number;
  overdue_amount: number;
  invoices: CreditClientInvoice[];
};

type CreditClientsResponse = {
  summary?: {
    count: number;
    credit_clients_count: number;
    total_pending: number;
    total_overdue: number;
  };
  items?: CreditClientItem[];
};

function getUniqueInvoices(invoices: CreditClientInvoice[]) {
  return Array.from(
    new Map(invoices.map((invoice) => [invoice.invoice_id, invoice])).values(),
  );
}

export default function CreditClientsSection() {
  const [items, setItems] = useState<CreditClientItem[]>([]);
  const [summary, setSummary] = useState<CreditClientsResponse["summary"]>();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCreditClients() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();

      const res = await fetch(
        `/api/finance/credit-clients${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar los clientes con crédito",
        );
      }

      const data = result.data as CreditClientsResponse;

      setItems(Array.isArray(data.items) ? data.items : []);
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los clientes con crédito");
      setItems([]);
      setSummary(undefined);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCreditClients();
  }, []);

  const localSummary = useMemo(() => {
    return {
      count: summary?.count ?? items.length,
      creditClientsCount:
        summary?.credit_clients_count ??
        items.filter((item) => item.has_credit_terms).length,
      totalPending:
        summary?.total_pending ??
        items.reduce((total, item) => total + item.pending_amount, 0),
      totalOverdue:
        summary?.total_overdue ??
        items.reduce((total, item) => total + item.overdue_amount, 0),
    };
  }, [items, summary]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.overdue_amount - a.overdue_amount);
  }, [items]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Clientes con crédito"
          title="Cuentas por cobrar"
          description="Clientes con condiciones de crédito, facturas abiertas o saldos pendientes."
        />

        <button
          type="button"
          onClick={loadCreditClients}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <FinanceSummaryCard
          label="Clientes"
          value={String(localSummary.count)}
          helper="Con crédito o saldo"
        />

        <FinanceSummaryCard
          label="Crédito activo"
          value={String(localSummary.creditClientsCount)}
          helper="Condición de crédito"
        />

        <FinanceSummaryCard
          label="Por cobrar"
          value={formatCurrency(localSummary.totalPending)}
          helper="Saldo pendiente"
        />

        <FinanceSummaryCard
          label="Vencido"
          value={formatCurrency(localSummary.totalOverdue)}
          helper="Saldo vencido"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_140px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              loadCreditClients();
            }
          }}
          placeholder="Buscar por cliente, teléfono, cédula o correo..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />

        <button
          type="button"
          onClick={loadCreditClients}
          disabled={loading}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buscar
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando clientes con crédito...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No hay clientes con crédito o saldos pendientes.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {sortedItems.map((item) => {
            const uniqueInvoices = getUniqueInvoices(item.invoices);
            const visibleInvoices = uniqueInvoices.slice(0, 3);
            const hiddenInvoicesCount = uniqueInvoices.length - 3;

            return (
              <div
                key={item.client_id}
                className={`rounded-2xl border p-4 ${
                  item.overdue_amount > 0
                    ? "border-red-300 bg-red-50/70"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {item.has_credit_terms && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Crédito activo
                        </span>
                      )}

                      {item.pending_amount > 0 && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Saldo pendiente
                        </span>
                      )}

                      {item.overdue_amount > 0 && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Vencido
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-slate-900">
                      {item.client_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Teléfono: {item.phone || "-"} · Email: {item.email || "-"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Cédula / ID fiscal: {item.tax_id || "-"} · Días crédito:{" "}
                      {item.default_credit_days ?? "-"}
                    </p>

                    {visibleInvoices.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {visibleInvoices.map((invoice) => (
                          <div
                            key={`${item.client_id}-${invoice.invoice_id}`}
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
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

                                <p className="mt-2 text-xs text-slate-500">
                                  Fecha: {formatDateLabel(invoice.invoice_date)}{" "}
                                  · Vence: {formatDateLabel(invoice.due_date)}
                                </p>
                              </div>

                              <div className="text-sm font-bold text-slate-900">
                                {formatCurrency(invoice.balance_amount)}
                              </div>
                            </div>
                          </div>
                        ))}

                        {hiddenInvoicesCount > 0 && (
                          <p className="text-xs font-medium text-slate-500">
                            +{hiddenInvoicesCount} factura
                            {hiddenInvoicesCount === 1 ? "" : "s"} más
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[480px]">
                    <MiniAmountCard
                      label="Facturas"
                      value={String(uniqueInvoices.length)}
                    />

                    <MiniAmountCard
                      label="Por cobrar"
                      value={formatCurrency(item.pending_amount)}
                    />

                    <MiniAmountCard
                      label="Límite crédito"
                      value={formatCurrency(item.credit_limit)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
