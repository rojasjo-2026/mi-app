"use client";

import { useEffect, useMemo, useState } from "react";
import type { FinanceInvoice, PendingBillablesResponse } from "../types";
import { formatCurrency, toSafeNumber } from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import SectionHeader from "./SectionHeader";

export default function ReportsSection() {
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [pendingBillablesSummary, setPendingBillablesSummary] =
    useState<PendingBillablesResponse["summary"]>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const [invoicesRes, pendingRes] = await Promise.all([
        fetch("/api/invoices", {
          cache: "no-store",
        }),
        fetch("/api/finance/pending-billables", {
          cache: "no-store",
        }),
      ]);

      const [invoicesResult, pendingResult] = await Promise.all([
        invoicesRes.json(),
        pendingRes.json(),
      ]);

      if (!invoicesRes.ok || !invoicesResult.success) {
        throw new Error(
          invoicesResult.message || "No se pudieron cargar las facturas",
        );
      }

      if (!pendingRes.ok || !pendingResult.success) {
        throw new Error(
          pendingResult.message ||
            "No se pudieron cargar los trabajos pendientes",
        );
      }

      setInvoices(
        Array.isArray(invoicesResult.data) ? invoicesResult.data : [],
      );
      setPendingBillablesSummary(
        (pendingResult.data as PendingBillablesResponse)?.summary,
      );
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los reportes financieros");
      setInvoices([]);
      setPendingBillablesSummary(undefined);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const reportSummary = useMemo(() => {
    const activeInvoices = invoices.filter(
      (invoice) => invoice.status !== "CANCELLED",
    );

    const totalInvoiced = activeInvoices.reduce(
      (total, invoice) => total + toSafeNumber(invoice.total_amount),
      0,
    );

    const totalPaid = invoices.reduce(
      (total, invoice) => total + toSafeNumber(invoice.paid_amount),
      0,
    );

    const totalBalance = activeInvoices.reduce(
      (total, invoice) => total + toSafeNumber(invoice.balance_amount),
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

    const paidInvoicesCount = invoices.filter(
      (invoice) => invoice.status === "PAID",
    ).length;

    const openInvoicesCount = invoices.filter(
      (invoice) =>
        invoice.status === "PENDING" ||
        invoice.status === "PARTIALLY_PAID" ||
        invoice.status === "OVERDUE",
    ).length;

    const overdueCount = invoices.filter(
      (invoice) => invoice.status === "OVERDUE",
    ).length;

    return {
      invoiceCount: invoices.length,
      paidInvoicesCount,
      openInvoicesCount,
      totalInvoiced,
      totalPaid,
      totalBalance,
      overdueAmount,
      overdueCount,
      cancelledAmount,
      pendingBillablesCount: pendingBillablesSummary?.count ?? 0,
      pendingBillablesAmount: pendingBillablesSummary?.total_amount ?? 0,
      pendingBillablesCost: pendingBillablesSummary?.total_cost ?? 0,
      pendingBillablesProfit: pendingBillablesSummary?.estimated_profit ?? 0,
    };
  }, [invoices, pendingBillablesSummary]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Reportes"
          title="Reportes e ingresos"
          description="Resumen general de facturación, cobros, pendientes y utilidad estimada."
        />

        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {reportSummary.overdueAmount > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Cobro prioritario</p>
          <p className="mt-1">
            Tienes {reportSummary.overdueCount} factura
            {reportSummary.overdueCount === 1 ? "" : "s"} vencida{reportSummary.overdueCount === 1 ? "" : "s"} por un total de {formatCurrency(
              reportSummary.overdueAmount,
            )}.
          </p>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Estado de facturación
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FinanceSummaryCard
            label="Total facturado"
            value={formatCurrency(reportSummary.totalInvoiced)}
            helper={`${reportSummary.invoiceCount} facturas registradas`}
          />

          <FinanceSummaryCard
            label="Total pagado"
            value={formatCurrency(reportSummary.totalPaid)}
            helper={`${reportSummary.paidInvoicesCount} facturas pagadas`}
          />

          <FinanceSummaryCard
            label="Saldo pendiente"
            value={formatCurrency(reportSummary.totalBalance)}
            helper={`${reportSummary.openInvoicesCount} facturas abiertas`}
          />

          <FinanceSummaryCard
            label="Vencido"
            value={formatCurrency(reportSummary.overdueAmount)}
            helper="Saldo vencido"
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Trabajos pendientes para facturar
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FinanceSummaryCard
            label="Trabajos pendientes"
            value={String(reportSummary.pendingBillablesCount)}
            helper="Instalaciones y mantenimientos"
          />

          <FinanceSummaryCard
            label="Monto pendiente"
            value={formatCurrency(reportSummary.pendingBillablesAmount)}
            helper="Por facturar"
          />

          <FinanceSummaryCard
            label="Costo estimado"
            value={formatCurrency(reportSummary.pendingBillablesCost)}
            helper="Costo interno"
          />

          <FinanceSummaryCard
            label="Utilidad estimada"
            value={formatCurrency(reportSummary.pendingBillablesProfit)}
            helper="Pendiente de facturar"
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Indicadores rápidos
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FinanceSummaryCard
            label="Cancelado"
            value={formatCurrency(reportSummary.cancelledAmount)}
            helper="Facturas canceladas"
          />

          <FinanceSummaryCard
            label="Facturas abiertas"
            value={String(reportSummary.openInvoicesCount)}
            helper="Pendiente, parcial o vencida"
          />

          <FinanceSummaryCard
            label="Facturas pagadas"
            value={String(reportSummary.paidInvoicesCount)}
            helper="Cerradas como pagadas"
          />

          <FinanceSummaryCard
            label="Potencial total"
            value={formatCurrency(
              reportSummary.totalInvoiced +
                reportSummary.pendingBillablesAmount,
            )}
            helper="Facturado + pendiente"
          />
        </div>
      </div>

      {loading && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando reportes financieros...
          </p>
        </div>
      )}
    </div>
  );
}
