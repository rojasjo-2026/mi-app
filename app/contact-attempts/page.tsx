"use client";

import { useEffect, useMemo, useState } from "react";

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

  async function loadFlows(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const response = await fetch("/api/contact-flows", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar la gestión de contactos.");
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error("La respuesta del servidor no fue exitosa.");
      }

      setFlows(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar los contactos.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadFlows();
  }, []);

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

  const counters = useMemo(
    () => ({
      all: flows.length,
      unread: flows.filter((flow) => hasUnreadMessages(flow)).length,
      waiting: flows.filter(
        (flow) =>
          flow.status === "WAITING_RESPONSE" || flow.status === "OPTIONS_SENT",
      ).length,
      confirmed: flows.filter((flow) => flow.status === "CONFIRMED").length,
      manual: flows.filter((flow) => flow.status === "MANUAL_REQUIRED").length,
    }),
    [flows],
  );

  const filteredFlows = useMemo(() => {
    if (filter === "all") return flows;

    if (filter === "unread") {
      return flows.filter((flow) => hasUnreadMessages(flow));
    }

    if (filter === "waiting") {
      return flows.filter(
        (flow) =>
          flow.status === "WAITING_RESPONSE" || flow.status === "OPTIONS_SENT",
      );
    }

    if (filter === "confirmed") {
      return flows.filter((flow) => flow.status === "CONFIRMED");
    }

    return flows.filter((flow) => flow.status === "MANUAL_REQUIRED");
  }, [filter, flows]);

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
                  onClick={() => setFilter(item.key)}
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

      {loading ? (
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
            <span>Cliente</span>
            <span>Instalación</span>
            <span>Estado</span>
            <span>Riesgo</span>
            <span>Objetivo</span>
            <span>Agendada</span>
            <span>Última interacción</span>
            <span>Acciones</span>
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
                      <p className="truncate text-sm font-bold text-slate-900">
                        {getClientFullName(flow.client)}
                      </p>

                      {hasUnreadMessages(flow) && (
                        <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {flow.unread_count}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {flow.client.phone_primary}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {flow.installation?.description ||
                        "Instalación sin descripción"}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
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
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
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
