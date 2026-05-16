"use client";

import { useEffect, useState } from "react";
import FinanceMenu from "./components/FinanceMenu";
import InvoicesSection from "./components/InvoicesSection";
import NewInvoiceSection from "./components/NewInvoiceSection";
import SearchInvoicesSection from "./components/SearchInvoicesSection";
import PendingBillablesSection from "./components/PendingBillablesSection";
import PaymentsSection from "./components/PaymentsSection";
import CreditClientsSection from "./components/CreditClientsSection";
import ReportsSection from "./components/ReportsSection";
import type {
  FinanceInvoice,
  FinanceMenuItem,
  PendingBillable,
  PendingBillablesResponse,
} from "./types";

export default function FinancesPage() {
  const [activeSection, setActiveSection] =
    useState<FinanceMenuItem>("Nueva factura");

  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const [pendingBillables, setPendingBillables] = useState<PendingBillable[]>(
    [],
  );
  const [pendingSummary, setPendingSummary] =
    useState<PendingBillablesResponse["summary"]>();
  const [loadingPendingBillables, setLoadingPendingBillables] = useState(false);
  const [pendingBillablesError, setPendingBillablesError] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingStatus, setPendingStatus] = useState("ALL");
  const [selectedBillable, setSelectedBillable] =
    useState<PendingBillable | null>(null);

  async function loadInvoices() {
    setLoadingInvoices(true);
    setInvoiceError("");

    try {
      const res = await fetch("/api/invoices", {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudieron cargar las facturas");
      }

      setInvoices(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error(error);
      setInvoiceError("No se pudieron cargar las facturas");
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function loadPendingBillables() {
    setLoadingPendingBillables(true);
    setPendingBillablesError("");

    try {
      const params = new URLSearchParams();

      if (pendingSearch.trim()) {
        params.set("search", pendingSearch.trim());
      }

      if (pendingStatus) {
        params.set("status", pendingStatus);
      }

      const query = params.toString();

      const res = await fetch(
        `/api/finance/pending-billables${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar los trabajos pendientes",
        );
      }

      const data = result.data as PendingBillablesResponse;

      setPendingBillables(Array.isArray(data.items) ? data.items : []);
      setPendingSummary(data.summary);
    } catch (error) {
      console.error(error);
      setPendingBillablesError("No se pudieron cargar los trabajos pendientes");
      setPendingBillables([]);
      setPendingSummary(undefined);
    } finally {
      setLoadingPendingBillables(false);
    }
  }

  useEffect(() => {
    if (activeSection !== "Facturas") return;

    loadInvoices();
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "Trabajos pendientes para facturar") return;

    loadPendingBillables();
  }, [activeSection]);

  return (
    <main className="min-h-screen bg-gray-50 px-8 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex rounded-full border bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Gestión financiera
            </div>

            <h1 className="mt-3 text-3xl font-bold text-slate-950">Finanzas</h1>

            <p className="mt-1 text-sm text-slate-600">
              Facturas, pagos, créditos e ingresos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection("Nueva factura")}
            className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            + Nueva factura
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <FinanceMenu
            activeSection={activeSection}
            onChange={setActiveSection}
          />

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {activeSection === "Facturas" && (
              <InvoicesSection
                invoices={invoices}
                loading={loadingInvoices}
                error={invoiceError}
                onRefresh={loadInvoices}
              />
            )}

            {activeSection === "Nueva factura" && <NewInvoiceSection />}

            {activeSection === "Buscar facturas" && <SearchInvoicesSection />}

            {activeSection === "Trabajos pendientes para facturar" && (
              <PendingBillablesSection
                items={pendingBillables}
                summary={pendingSummary}
                loading={loadingPendingBillables}
                error={pendingBillablesError}
                search={pendingSearch}
                status={pendingStatus}
                selectedBillable={selectedBillable}
                onSearchChange={setPendingSearch}
                onStatusChange={setPendingStatus}
                onRefresh={loadPendingBillables}
                onSelectBillable={setSelectedBillable}
                onClearSelection={() => setSelectedBillable(null)}
                onInvoiceCreated={() => {
                  setSelectedBillable(null);
                  loadPendingBillables();
                  loadInvoices();
                }}
              />
            )}

            {activeSection === "Pagos" && <PaymentsSection />}

            {activeSection === "Clientes con crédito" && (
              <CreditClientsSection />
            )}

            {activeSection === "Reportes / ingresos" && <ReportsSection />}
          </section>
        </div>
      </div>
    </main>
  );
}
