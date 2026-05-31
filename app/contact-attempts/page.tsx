"use client";

import { useEffect, useState } from "react";

import ContactFlowChat from "./components/ContactFlowChat";
import type {
  ApiResponse,
  ContactFlowItem,
  FilterType,
  ViewMode,
} from "./types";
import {
  formatDate,
  formatDateTime,
  getClientFullName,
  getLastMessagePreview,
  getMessageTypeLabel,
  getOperationalRisk,
  getStatusClasses,
  getStatusLabel,
  hasUnreadMessages,
} from "./utils";

type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type ContactFlowMetrics = {
  all: number;
  unread: number;
  waiting: number;
  confirmed: number;
  manual: number;
};

type ContactFlowSortKey =
  | "client"
  | "installation"
  | "status"
  | "risk"
  | "targetDate"
  | "selectedDate"
  | "lastInteraction";

type SortDirection = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const SORTABLE_HEADERS: {
  key: ContactFlowSortKey | null;
  label: string;
}[] = [
  { key: "client", label: "Cliente" },
  { key: "installation", label: "Instalación" },
  { key: "status", label: "Estado" },
  { key: "risk", label: "Riesgo" },
  { key: "targetDate", label: "Objetivo" },
  { key: "selectedDate", label: "Agendada" },
  { key: "lastInteraction", label: "Última interacción" },
  { key: null, label: "Acciones" },
];

export default function ContactAttemptsPage() {
  const [flows, setFlows] = useState<ContactFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [mounted, setMounted] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<ContactFlowItem | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState<ContactFlowMetrics>({
    all: 0,
    unread: 0,
    waiting: 0,
    confirmed: 0,
    manual: 0,
  });
  const [sortKey, setSortKey] = useState<ContactFlowSortKey>("lastInteraction");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  async function loadFlows(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const params = new URLSearchParams();

      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));
      params.set("filter", filter);
      params.set("sortKey", sortKey);
      params.set("sortDirection", sortDirection);

      const response = await fetch(`/api/contact-flows?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar la gestión de contactos.");
      }

      const result = (await response.json()) as ApiResponse & {
        pagination?: PaginationState;
        metrics?: Partial<ContactFlowMetrics>;
      };

      if (!result.success) {
        throw new Error("La respuesta del servidor no fue exitosa.");
      }

      const nextFlows = result.data ?? [];

      setFlows(nextFlows);
      setPagination(
        result.pagination ?? {
          page: currentPage,
          pageSize,
          totalItems: nextFlows.length,
          totalPages: 1,
        },
      );
      setMetrics({
        all: Number(result.metrics?.all ?? nextFlows.length),
        unread: Number(result.metrics?.unread ?? 0),
        waiting: Number(result.metrics?.waiting ?? 0),
        confirmed: Number(result.metrics?.confirmed ?? 0),
        manual: Number(result.metrics?.manual ?? 0),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar los contactos.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setHasLoadedOnce(true);
    }
  }

  useEffect(() => {
    void loadFlows(!hasLoadedOnce);
  }, [filter, currentPage, pageSize, sortDirection, sortKey]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleRefreshList() {
    void loadFlows(false);
  }

  function handleOpenConversation(flow: ContactFlowItem) {
    setFlows((currentFlows) =>
      currentFlows.map((item) =>
        item.contact_flow_id === flow.contact_flow_id
          ? {
              ...item,
              unread_count: 0,
              has_unread_messages: false,
            }
          : item,
      ),
    );

    setSelectedFlow({
      ...flow,
      unread_count: 0,
      has_unread_messages: false,
    });
  }

  const counters = metrics;
  const filteredFlows = flows;
  const totalPages = Math.max(1, pagination.totalPages);
  const safeCurrentPage = Math.min(pagination.page || currentPage, totalPages);
  const pageStartIndex =
    pagination.totalItems === 0
      ? 0
      : (safeCurrentPage - 1) * pagination.pageSize + 1;
  const pageEndIndex = Math.min(
    safeCurrentPage * pagination.pageSize,
    pagination.totalItems,
  );

  function handleFilterChange(nextFilter: FilterType) {
    setCurrentPage(1);
    setFilter(nextFilter);
  }

  function handleSort(nextSortKey: ContactFlowSortKey) {
    setCurrentPage(1);
    setSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );

        return currentSortKey;
      }

      setSortDirection(nextSortKey === "lastInteraction" ? "desc" : "asc");
      return nextSortKey;
    });
  }

  function getSortIndicator(headerKey: ContactFlowSortKey | null) {
    if (!headerKey) return null;

    if (headerKey !== sortKey) {
      return "↕";
    }

    return sortDirection === "asc" ? "↑" : "↓";
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Gestión de contacto
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Intentos de contacto
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Visualiza el estado de los contactos automáticos y las
              confirmaciones de mantenimiento.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleRefreshList}
              disabled={refreshing}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refrescando..." : "Refrescar lista"}
            </button>

            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              Ver
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-sm font-medium outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {mounted && (
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    viewMode === "list"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Lista
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    viewMode === "grid"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Grid
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { key: "all" as const, label: "Todos", count: counters.all },
                {
                  key: "unread" as const,
                  label: "Sin leer",
                  count: counters.unread,
                },
                {
                  key: "waiting" as const,
                  label: "En gestión",
                  count: counters.waiting,
                },
                {
                  key: "confirmed" as const,
                  label: "Confirmados",
                  count: counters.confirmed,
                },
                {
                  key: "manual" as const,
                  label: "Manual",
                  count: counters.manual,
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleFilterChange(item.key)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                    filter === item.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        filter === item.key
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading && !hasLoadedOnce ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Cargando contactos...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          No hay contactos para mostrar con el filtro seleccionado.
        </div>
      ) : viewMode === "list" ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.3fr_1.4fr_1fr_1fr_120px_120px_145px_130px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 xl:grid">
            {SORTABLE_HEADERS.map((header) => (
              <button
                key={header.label}
                type="button"
                disabled={!header.key}
                title={header.key ? `Ordenar por ${header.label}` : undefined}
                onClick={() => {
                  if (header.key) {
                    handleSort(header.key);
                  }
                }}
                className={[
                  "flex min-w-0 items-center gap-2 text-left uppercase tracking-[0.16em]",
                  header.key
                    ? "cursor-pointer transition hover:text-slate-800"
                    : "cursor-default",
                  header.key === sortKey ? "text-slate-800" : "text-slate-500",
                ].join(" ")}
              >
                <span className="truncate">{header.label}</span>
                {header.key && (
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-500">
                    {getSortIndicator(header.key)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {filteredFlows.map((flow) => {
              const risk = getOperationalRisk(flow);

              return (
                <article
                  key={flow.contact_flow_id}
                  className={`grid gap-4 px-5 py-4 transition xl:grid-cols-[1.3fr_1.4fr_1fr_1fr_120px_120px_145px_130px] xl:items-center ${
                    hasUnreadMessages(flow)
                      ? "bg-emerald-50/60 hover:bg-emerald-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        title={getClientFullName(flow.client)}
                        className="truncate text-sm font-bold text-slate-900"
                      >
                        {getClientFullName(flow.client)}
                      </p>

                      {hasUnreadMessages(flow) && (
                        <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {flow.unread_count}
                        </span>
                      )}
                    </div>

                    <p
                      title={flow.client.phone_primary || "Sin teléfono"}
                      className="mt-1 text-xs font-medium text-slate-500"
                    >
                      {flow.client.phone_primary}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p
                      title={
                        flow.installation?.description ||
                        "Instalación sin descripción"
                      }
                      className="truncate text-sm font-medium text-slate-800"
                    >
                      {flow.installation?.description ||
                        "Instalación sin descripción"}
                    </p>
                    <p
                      title={flow.follow_up.reason || "Sin motivo registrado"}
                      className="mt-1 line-clamp-1 text-xs text-slate-500"
                    >
                      {flow.follow_up.reason || "Sin motivo registrado"}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        flow.status,
                      )}`}
                    >
                      {getStatusLabel(flow.status)}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${risk.classes}`}
                    >
                      {risk.label}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
                      Fecha objetivo
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(flow.follow_up.target_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
                      Fecha agendada
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(
                        flow.selected_date || flow.follow_up.scheduled_date,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
                      Última interacción
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDateTime(flow.last_message_at)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {getMessageTypeLabel(flow.last_message?.direction)}
                    </p>

                    {flow.last_message && (
                      <p
                        title={getLastMessagePreview(flow.last_message)}
                        className="mt-1 line-clamp-1 text-xs text-slate-500"
                      >
                        {getLastMessagePreview(flow.last_message)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenConversation(flow)}
                      className="relative rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Conversación
                      {hasUnreadMessages(flow) && (
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                          {flow.unread_count}
                        </span>
                      )}
                    </button>

                    {flow.installation?.installation_id && (
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/installations/${flow.installation?.installation_id}`;
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Instalación
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/follow-ups/${flow.follow_up.follow_up_id}`;
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Mant.
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredFlows.map((flow) => {
            const risk = getOperationalRisk(flow);

            return (
              <article
                key={flow.contact_flow_id}
                className={`rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${
                  hasUnreadMessages(flow)
                    ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold text-slate-900">
                        {getClientFullName(flow.client)}
                      </h2>

                      {hasUnreadMessages(flow) && (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {flow.unread_count} nuevo
                          {flow.unread_count === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {flow.installation?.description ||
                        "Instalación sin descripción"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      flow.status,
                    )}`}
                  >
                    {getStatusLabel(flow.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${risk.classes}`}
                  >
                    {risk.label}
                  </span>

                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Prioridad {flow.follow_up.priority}
                  </span>

                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {flow.client.phone_primary}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Último mensaje
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {getMessageTypeLabel(flow.last_message?.direction)}
                    </p>
                  </div>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                    {getLastMessagePreview(flow.last_message)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Objetivo
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDate(flow.follow_up.target_date)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Agendada
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDate(
                        flow.selected_date || flow.follow_up.scheduled_date,
                      )}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Última interacción
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDateTime(flow.last_message_at)}
                    </p>
                  </div>
                </div>

                {flow.manual_reason && (
                  <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {flow.manual_reason}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenConversation(flow)}
                    className="relative rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Conversación
                    {hasUnreadMessages(flow) && (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                        {flow.unread_count}
                      </span>
                    )}
                  </button>

                  {flow.installation?.installation_id && (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/installations/${flow.installation?.installation_id}`;
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Instalación
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/follow-ups/${flow.follow_up.follow_up_id}`;
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Mant.
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredFlows.length > 0 && (
        <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium">
            Mostrando{" "}
            <span className="font-semibold">
              {pageStartIndex}-{pageEndIndex}
            </span>{" "}
            de <span className="font-semibold">{pagination.totalItems}</span>{" "}
            contactos · Página{" "}
            <span className="font-semibold">{safeCurrentPage}</span> de{" "}
            <span className="font-semibold">{totalPages}</span>
            {refreshing && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                Actualizando...
              </span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage <= 1 || refreshing}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={safeCurrentPage >= totalPages || refreshing}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {selectedFlow && (
        <ContactFlowChat
          contactFlowId={selectedFlow.contact_flow_id}
          clientName={getClientFullName(selectedFlow.client)}
          installationName={
            selectedFlow.installation?.description ||
            "Instalación sin descripción"
          }
          onClose={() => setSelectedFlow(null)}
          onMessageSent={loadFlows}
        />
      )}
    </div>
  );
}
