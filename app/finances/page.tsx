"use client";

import { useEffect, useState } from "react";
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

type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type InvoiceMetrics = {
  totalInvoiced: number;
  pendingAmount: number;
  paidAmount: number;
  overdueAmount: number;
  cancelledAmount: number;
  overdueCount: number;
};

type InvoiceStatusFilter =
  | "ALL"
  | "DRAFT"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

type InvoiceSortKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status";

type SortDirection = "asc" | "desc";

type PendingSortKey =
  | "type"
  | "client"
  | "work"
  | "date"
  | "amount"
  | "cost"
  | "profit"
  | "status";

const DEFAULT_INVOICE_PAGE_SIZE = 15;
const DEFAULT_PENDING_PAGE_SIZE = 15;

const DEFAULT_INVOICE_METRICS: InvoiceMetrics = {
  totalInvoiced: 0,
  pendingAmount: 0,
  paidAmount: 0,
  overdueAmount: 0,
  cancelledAmount: 0,
  overdueCount: 0,
};

const FINANCE_TABS: FinanceMenuItem[] = [
  "Facturas",
  "Trabajos pendientes para facturar",
  "Pagos",
  "Clientes con crédito",
  "Reportes / ingresos",
];

function getFinanceTabLabel(section: FinanceMenuItem) {
  if (section === "Trabajos pendientes para facturar") {
    return "Trabajos pendientes";
  }

  return section;
}

function getTabClass(active: boolean) {
  return [
    "relative inline-flex h-10 items-center justify-center whitespace-nowrap border-b-2 px-1 text-sm font-semibold transition",
    active
      ? "border-blue-600 text-blue-700"
      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
  ].join(" ");
}

export default function FinancesPage() {
  const [activeSection, setActiveSection] =
    useState<FinanceMenuItem>("Facturas");

  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatus, setInvoiceStatus] =
    useState<InvoiceStatusFilter>("ALL");
  const [invoiceDateFrom, setInvoiceDateFrom] = useState("");
  const [invoiceDateTo, setInvoiceDateTo] = useState("");
  const [invoicePageSize, setInvoicePageSize] = useState(
    DEFAULT_INVOICE_PAGE_SIZE,
  );
  const [invoiceCurrentPage, setInvoiceCurrentPage] = useState(1);
  const [invoiceSortKey, setInvoiceSortKey] = useState<InvoiceSortKey>("date");
  const [invoiceSortDirection, setInvoiceSortDirection] =
    useState<SortDirection>("desc");
  const [invoicePagination, setInvoicePagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_INVOICE_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  const [invoiceMetrics, setInvoiceMetrics] = useState<InvoiceMetrics>(
    DEFAULT_INVOICE_METRICS,
  );

  const [pendingBillables, setPendingBillables] = useState<PendingBillable[]>(
    [],
  );
  const [pendingSummary, setPendingSummary] =
    useState<PendingBillablesResponse["summary"]>();
  const [loadingPendingBillables, setLoadingPendingBillables] = useState(false);
  const [pendingBillablesError, setPendingBillablesError] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingStatus, setPendingStatus] = useState("ALL");
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [pendingPageSize, setPendingPageSize] = useState(
    DEFAULT_PENDING_PAGE_SIZE,
  );
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [pendingSortKey, setPendingSortKey] = useState<PendingSortKey>("date");
  const [pendingSortDirection, setPendingSortDirection] =
    useState<SortDirection>("desc");
  const [pendingPagination, setPendingPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PENDING_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  const [selectedBillable, setSelectedBillable] =
    useState<PendingBillable | null>(null);

  async function loadInvoices() {
    setLoadingInvoices(true);
    setInvoiceError("");

    try {
      const params = new URLSearchParams();

      params.set("page", String(invoiceCurrentPage));
      params.set("pageSize", String(invoicePageSize));
      params.set("sortKey", invoiceSortKey);
      params.set("sortDirection", invoiceSortDirection);

      if (invoiceSearch.trim()) {
        params.set("search", invoiceSearch.trim());
      }

      if (invoiceStatus !== "ALL") {
        params.set("status", invoiceStatus);
      }

      if (invoiceDateFrom) {
        params.set("dateFrom", invoiceDateFrom);
      }

      if (invoiceDateTo) {
        params.set("dateTo", invoiceDateTo);
      }

      const res = await fetch(`/api/invoices?${params.toString()}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudieron cargar las facturas");
      }

      const nextInvoices = Array.isArray(result.data) ? result.data : [];
      const nextPagination: PaginationState = result.pagination ?? {
        page: invoiceCurrentPage,
        pageSize: invoicePageSize,
        totalItems: nextInvoices.length,
        totalPages: 1,
      };

      setInvoices(nextInvoices);
      setInvoicePagination(nextPagination);
      setInvoiceMetrics({
        totalInvoiced: Number(result.metrics?.totalInvoiced ?? 0),
        pendingAmount: Number(result.metrics?.pendingAmount ?? 0),
        paidAmount: Number(result.metrics?.paidAmount ?? 0),
        overdueAmount: Number(result.metrics?.overdueAmount ?? 0),
        cancelledAmount: Number(result.metrics?.cancelledAmount ?? 0),
        overdueCount: Number(result.metrics?.overdueCount ?? 0),
      });

      if (
        nextPagination.totalPages > 0 &&
        invoiceCurrentPage > nextPagination.totalPages
      ) {
        setInvoiceCurrentPage(nextPagination.totalPages);
      }
    } catch (error) {
      console.error(error);
      setInvoiceError("No se pudieron cargar las facturas");
      setInvoices([]);
      setInvoicePagination({
        page: 1,
        pageSize: invoicePageSize,
        totalItems: 0,
        totalPages: 1,
      });
      setInvoiceMetrics(DEFAULT_INVOICE_METRICS);
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function loadPendingBillables() {
    setLoadingPendingBillables(true);
    setPendingBillablesError("");

    try {
      const params = new URLSearchParams();

      params.set("page", String(pendingCurrentPage));
      params.set("pageSize", String(pendingPageSize));
      params.set("sortKey", pendingSortKey);
      params.set("sortDirection", pendingSortDirection);

      if (pendingSearch.trim()) {
        params.set("search", pendingSearch.trim());
      }

      if (pendingStatus) {
        params.set("status", pendingStatus);
      }

      if (pendingDateFrom) {
        params.set("dateFrom", pendingDateFrom);
      }

      if (pendingDateTo) {
        params.set("dateTo", pendingDateTo);
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

      const data = result.data as PendingBillablesResponse & {
        pagination?: PaginationState;
      };
      const nextItems = Array.isArray(data.items) ? data.items : [];
      const nextPagination: PaginationState = data.pagination ??
        result.pagination ?? {
          page: pendingCurrentPage,
          pageSize: pendingPageSize,
          totalItems: nextItems.length,
          totalPages: 1,
        };

      setPendingBillables(nextItems);
      setPendingSummary(data.summary);
      setPendingPagination(nextPagination);

      if (
        nextPagination.totalPages > 0 &&
        pendingCurrentPage > nextPagination.totalPages
      ) {
        setPendingCurrentPage(nextPagination.totalPages);
      }
    } catch (error) {
      console.error(error);
      setPendingBillablesError("No se pudieron cargar los trabajos pendientes");
      setPendingBillables([]);
      setPendingSummary(undefined);
      setPendingPagination({
        page: 1,
        pageSize: pendingPageSize,
        totalItems: 0,
        totalPages: 1,
      });
    } finally {
      setLoadingPendingBillables(false);
    }
  }

  function handleInvoiceSortChange(nextSortKey: InvoiceSortKey) {
    setInvoiceSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setInvoiceSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );
        return currentSortKey;
      }

      setInvoiceSortDirection(
        nextSortKey === "total" || nextSortKey === "balance" ? "desc" : "asc",
      );
      return nextSortKey;
    });
  }

  function handlePendingSortChange(nextSortKey: PendingSortKey) {
    setPendingSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setPendingSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );
        return currentSortKey;
      }

      setPendingSortDirection(
        ["amount", "cost", "profit", "date"].includes(nextSortKey)
          ? "desc"
          : "asc",
      );
      return nextSortKey;
    });
  }

  useEffect(() => {
    if (activeSection !== "Facturas") return;

    loadInvoices();
  }, [
    activeSection,
    invoiceCurrentPage,
    invoicePageSize,
    invoiceDateFrom,
    invoiceDateTo,
    invoiceSearch,
    invoiceSortDirection,
    invoiceSortKey,
    invoiceStatus,
  ]);

  useEffect(() => {
    setInvoiceCurrentPage(1);
  }, [
    invoiceDateFrom,
    invoiceDateTo,
    invoiceSearch,
    invoiceStatus,
    invoicePageSize,
    invoiceSortKey,
    invoiceSortDirection,
  ]);

  useEffect(() => {
    if (activeSection !== "Trabajos pendientes para facturar") return;

    loadPendingBillables();
  }, [
    activeSection,
    pendingCurrentPage,
    pendingDateFrom,
    pendingDateTo,
    pendingPageSize,
    pendingSearch,
    pendingSortDirection,
    pendingSortKey,
    pendingStatus,
  ]);

  useEffect(() => {
    setPendingCurrentPage(1);
  }, [
    pendingDateFrom,
    pendingDateTo,
    pendingPageSize,
    pendingSearch,
    pendingSortDirection,
    pendingSortKey,
    pendingStatus,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Gestión financiera
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Finanzas
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Facturas, pagos, créditos e ingresos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection("Nueva factura")}
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nueva factura
          </button>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex gap-6 overflow-x-auto">
            {FINANCE_TABS.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={getTabClass(activeSection === section)}
              >
                {getFinanceTabLabel(section)}
              </button>
            ))}
          </div>
        </div>

        <section className="min-w-0">
          {activeSection === "Facturas" && (
            <InvoicesSection
              invoices={invoices}
              loading={loadingInvoices}
              error={invoiceError}
              onRefresh={loadInvoices}
              pagination={invoicePagination}
              metrics={invoiceMetrics}
              search={invoiceSearch}
              status={invoiceStatus}
              dateFrom={invoiceDateFrom}
              dateTo={invoiceDateTo}
              pageSize={invoicePageSize}
              sortKey={invoiceSortKey}
              sortDirection={invoiceSortDirection}
              onSearchChange={setInvoiceSearch}
              onStatusChange={setInvoiceStatus}
              onDateFromChange={setInvoiceDateFrom}
              onDateToChange={setInvoiceDateTo}
              onPageChange={setInvoiceCurrentPage}
              onPageSizeChange={setInvoicePageSize}
              onSortChange={handleInvoiceSortChange}
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
              dateFrom={pendingDateFrom}
              dateTo={pendingDateTo}
              selectedBillable={selectedBillable}
              pagination={pendingPagination}
              pageSize={pendingPageSize}
              sortKey={pendingSortKey}
              sortDirection={pendingSortDirection}
              onSearchChange={setPendingSearch}
              onStatusChange={setPendingStatus}
              onDateFromChange={setPendingDateFrom}
              onDateToChange={setPendingDateTo}
              onRefresh={loadPendingBillables}
              onSelectBillable={setSelectedBillable}
              onClearSelection={() => setSelectedBillable(null)}
              onPageChange={setPendingCurrentPage}
              onPageSizeChange={setPendingPageSize}
              onSortChange={handlePendingSortChange}
              onInvoiceCreated={() => {
                setSelectedBillable(null);
                loadPendingBillables();
                loadInvoices();
              }}
            />
          )}

          {activeSection === "Pagos" && <PaymentsSection />}

          {activeSection === "Clientes con crédito" && <CreditClientsSection />}

          {activeSection === "Reportes / ingresos" && <ReportsSection />}
        </section>
      </div>
    </main>
  );
}
