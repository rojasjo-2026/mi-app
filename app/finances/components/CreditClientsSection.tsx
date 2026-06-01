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

type CreditClientsSummary = {
  count: number;
  credit_clients_count: number;
  total_pending: number;
  total_overdue: number;
};

type CreditClientsPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type CreditClientsResponse = {
  summary?: CreditClientsSummary;
  items?: CreditClientItem[];
};

type CreditClientScope = "ALL" | "WITH_BALANCE" | "OVERDUE" | "CREDIT_ONLY";
type CreditClientSortKey =
  | "client"
  | "pending"
  | "overdue"
  | "creditLimit"
  | "invoiceCount";
type SortDirection = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const SCOPE_OPTIONS: { label: string; value: CreditClientScope }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Con saldo", value: "WITH_BALANCE" },
  { label: "Vencidos", value: "OVERDUE" },
  { label: "Solo crédito activo", value: "CREDIT_ONLY" },
];

function toSafeNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getUniqueInvoices(invoices: CreditClientInvoice[]) {
  return Array.from(
    new Map(invoices.map((invoice) => [invoice.invoice_id, invoice])).values(),
  );
}

function getClientStatusLabel(item: CreditClientItem) {
  if (item.overdue_amount > 0) return "Vencido";
  if (item.pending_amount > 0) return "Saldo pendiente";
  if (item.has_credit_terms) return "Crédito activo";

  return "Sin saldo";
}

function getClientStatusClass(item: CreditClientItem) {
  if (item.overdue_amount > 0) {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (item.pending_amount > 0) {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (item.has_credit_terms) {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-600";
}

function SortButton({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  sortKey: CreditClientSortKey;
  activeSortKey: CreditClientSortKey;
  sortDirection: SortDirection;
  onSort: (key: CreditClientSortKey) => void;
}) {
  const isActive = sortKey === activeSortKey;
  const indicator = isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      title={`Ordenar por ${label}`}
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
        isActive
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      {label}
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px]">
        {indicator}
      </span>
    </button>
  );
}

export default function CreditClientsSection() {
  const [items, setItems] = useState<CreditClientItem[]>([]);
  const [summary, setSummary] = useState<CreditClientsSummary>({
    count: 0,
    credit_clients_count: 0,
    total_pending: 0,
    total_overdue: 0,
  });
  const [pagination, setPagination] = useState<CreditClientsPagination>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<CreditClientScope>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<CreditClientSortKey>("pending");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCreditClients() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("scope", scope);
      params.set("sortKey", sortKey);
      params.set("sortDirection", sortDirection);

      if (search.trim()) params.set("search", search.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/finance/credit-clients?${params}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar los clientes con crédito",
        );
      }

      const data = result.data as CreditClientsResponse;
      const nextItems = Array.isArray(data.items) ? data.items : [];

      setItems(nextItems);
      setSummary({
        count: Number(data.summary?.count ?? 0),
        credit_clients_count: Number(data.summary?.credit_clients_count ?? 0),
        total_pending: Number(data.summary?.total_pending ?? 0),
        total_overdue: Number(data.summary?.total_overdue ?? 0),
      });
      setPagination(
        result.pagination ?? {
          page,
          pageSize,
          totalItems: nextItems.length,
          totalPages: 1,
        },
      );
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los clientes con crédito");
      setItems([]);
      setSummary({
        count: 0,
        credit_clients_count: 0,
        total_pending: 0,
        total_overdue: 0,
      });
      setPagination({
        page: 1,
        pageSize,
        totalItems: 0,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSort(nextSortKey: CreditClientSortKey) {
    setSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );

        return currentSortKey;
      }

      setSortDirection(nextSortKey === "client" ? "asc" : "desc");

      return nextSortKey;
    });
  }

  function clearFilters() {
    setSearch("");
    setScope("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  useEffect(() => {
    loadCreditClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, scope, dateFrom, dateTo, sortKey, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [scope, dateFrom, dateTo, pageSize, sortKey, sortDirection]);

  const hasActiveFilters = Boolean(
    search.trim() || scope !== "ALL" || dateFrom || dateTo,
  );

  const safeCurrentPage = Math.min(
    Math.max(1, pagination.page || 1),
    Math.max(1, pagination.totalPages || 1),
  );
  const totalPages = Math.max(1, pagination.totalPages || 1);
  const pageStartIndex =
    pagination.totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEndIndex = Math.min(
    safeCurrentPage * pageSize,
    pagination.totalItems,
  );

  const sortedVisibleItems = useMemo(() => items, [items]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Clientes con crédito"
          title="Clientes con crédito y saldo pendiente"
          description="Vista agrupada por cliente para controlar crédito, deuda acumulada y facturas abiertas."
        />

        <button
          type="button"
          onClick={loadCreditClients}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <FinanceSummaryCard
          label="Clientes"
          value={String(summary.count)}
          helper="Con crédito o saldo"
        />

        <FinanceSummaryCard
          label="Crédito activo"
          value={String(summary.credit_clients_count)}
          helper="Condición de crédito"
        />

        <FinanceSummaryCard
          label="Por cobrar"
          value={formatCurrency(summary.total_pending)}
          helper="Saldo pendiente total"
        />

        <FinanceSummaryCard
          label="Vencido"
          value={formatCurrency(summary.total_overdue)}
          helper="Saldo vencido total"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_210px_160px_160px_120px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                loadCreditClients();
              }
            }}
            placeholder="Buscar por cliente, teléfono, cédula o correo..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />

          <select
            value={scope}
            onChange={(event) =>
              setScope(event.target.value as CreditClientScope)
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Desde
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
            />
          </label>

          <label className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Hasta
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              loadCreditClients();
            }}
            disabled={loading}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Buscar
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <SortButton
              label="Cliente"
              sortKey="client"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortButton
              label="Por cobrar"
              sortKey="pending"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortButton
              label="Vencido"
              sortKey="overdue"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortButton
              label="Límite"
              sortKey="creditLimit"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortButton
              label="Facturas"
              sortKey="invoiceCount"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
              >
                Limpiar filtros
              </button>
            )}

            <label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
              Ver
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="bg-transparent text-sm font-bold outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando clientes con crédito...
          </p>
        </div>
      ) : sortedVisibleItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No hay clientes con crédito o saldos pendientes.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {sortedVisibleItems.map((item) => {
            const uniqueInvoices = getUniqueInvoices(item.invoices);
            const visibleInvoices = uniqueInvoices.slice(0, 3);
            const hiddenInvoicesCount = uniqueInvoices.length - 3;
            const clientStatusLabel = getClientStatusLabel(item);
            const isOverCredit =
              toSafeNumber(item.credit_limit) > 0 &&
              item.pending_amount > toSafeNumber(item.credit_limit);

            return (
              <article
                key={item.client_id}
                className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
                  item.overdue_amount > 0
                    ? "border-red-200"
                    : isOverCredit
                      ? "border-amber-200"
                      : "border-slate-200"
                }`}
              >
                <div
                  className={`grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_420px] ${
                    item.overdue_amount > 0
                      ? "bg-red-50/50"
                      : isOverCredit
                        ? "bg-amber-50/40"
                        : "bg-slate-50/60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getClientStatusClass(item)}`}
                      >
                        {clientStatusLabel}
                      </span>

                      {item.has_credit_terms && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          Crédito activo
                        </span>
                      )}

                      {isOverCredit && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          Sobre límite
                        </span>
                      )}
                    </div>

                    <h3
                      title={item.client_name}
                      className="mt-3 truncate text-base font-black text-slate-950"
                    >
                      {item.client_name}
                    </h3>

                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                      Teléfono: {item.phone || "-"} · Email: {item.email || "-"}
                    </p>

                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                      Cédula / ID fiscal: {item.tax_id || "-"} · Días crédito:{" "}
                      {item.default_credit_days ?? "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <MiniAmountCard
                      label="Facturas"
                      value={String(item.invoice_count)}
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

                {visibleInvoices.length > 0 ? (
                  <div className="overflow-x-auto border-t border-slate-100">
                    <div className="min-w-[840px]">
                      <div className="grid grid-cols-[1.2fr_150px_130px_130px_160px_40px] bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                        <div>Factura</div>
                        <div>Estado</div>
                        <div>Fecha</div>
                        <div>Vence</div>
                        <div className="text-right">Saldo pendiente</div>
                        <div />
                      </div>

                      <div className="divide-y divide-slate-100">
                        {visibleInvoices.map((invoice) => (
                          <a
                            key={`${item.client_id}-${invoice.invoice_id}`}
                            href={`/finances?invoice_id=${invoice.invoice_id}`}
                            className="grid grid-cols-[1.2fr_150px_130px_130px_160px_40px] px-4 py-3 text-sm transition hover:bg-blue-50/60"
                          >
                            <div
                              title={invoice.invoice_number || "Sin número"}
                              className="truncate font-black text-slate-900"
                            >
                              {invoice.invoice_number || "Sin número"}
                            </div>

                            <div>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getInvoiceStatusClass(
                                  invoice.status,
                                )}`}
                              >
                                {getInvoiceStatusLabel(invoice.status)}
                              </span>
                            </div>

                            <div className="font-semibold text-slate-700">
                              {formatDateLabel(invoice.invoice_date)}
                            </div>

                            <div
                              className={`font-semibold ${
                                invoice.status === "OVERDUE"
                                  ? "text-red-700"
                                  : "text-slate-700"
                              }`}
                            >
                              {formatDateLabel(invoice.due_date)}
                            </div>

                            <div className="text-right font-black text-slate-950">
                              {formatCurrency(invoice.balance_amount)}
                            </div>

                            <div className="text-right text-slate-400">›</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 px-4 py-3 text-sm font-medium text-slate-500">
                    Este cliente tiene crédito activo, pero no tiene facturas
                    abiertas con saldo pendiente.
                  </div>
                )}

                {hiddenInvoicesCount > 0 && (
                  <div className="border-t border-slate-100 px-4 py-3 text-right text-sm font-bold text-blue-700">
                    +{hiddenInvoicesCount} factura
                    {hiddenInvoicesCount === 1 ? "" : "s"} más
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          Mostrando {pageStartIndex}-{pageEndIndex} de {pagination.totalItems}{" "}
          clientes · Página {safeCurrentPage} de {totalPages}
          {loading && items.length > 0 ? " · Actualizando..." : ""}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage <= 1}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, safeCurrentPage + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
