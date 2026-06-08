"use client";

import type { ContactFlowItem } from "../types";
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
} from "../utils";

type ContactFlowSortKey =
  | "client"
  | "installation"
  | "status"
  | "risk"
  | "targetDate"
  | "selectedDate"
  | "lastInteraction";

type SortDirection = "asc" | "desc";

type ContactAttemptsTableProps = {
  flows: ContactFlowItem[];
  sortKey: ContactFlowSortKey;
  sortDirection: SortDirection;
  viewMode: "list" | "grid";
  onSort: (sortKey: ContactFlowSortKey) => void;
  onOpenConversation: (flow: ContactFlowItem) => void;
};

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

export function ContactAttemptsTable({
  flows,
  sortKey,
  sortDirection,
  viewMode,
  onSort,
  onOpenConversation,
}: ContactAttemptsTableProps) {
  function getSortIndicator(headerKey: ContactFlowSortKey | null) {
    if (!headerKey) return null;

    if (headerKey !== sortKey) {
      return "↕";
    }

    return sortDirection === "asc" ? "↑" : "↓";
  }

  if (viewMode === "grid") {
    return (
      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {flows.map((flow) => {
          const risk = getOperationalRisk(flow);

          return (
            <article
              key={flow.contact_flow_id}
              className={[
                "rounded-xl border p-5 shadow-sm transition hover:shadow-md",
                hasUnreadMessages(flow)
                  ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                  : "border-slate-200 bg-white hover:border-slate-300",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
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

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
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

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenConversation(flow)}
                  className="relative rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Instalación
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/follow-ups/${flow.follow_up.follow_up_id}`;
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Mant.
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden grid-cols-[1.3fr_1.4fr_1fr_1fr_120px_120px_145px_130px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 xl:grid">
        {SORTABLE_HEADERS.map((header) => (
          <button
            key={header.label}
            type="button"
            disabled={!header.key}
            title={header.key ? `Ordenar por ${header.label}` : undefined}
            onClick={() => {
              if (header.key) {
                onSort(header.key);
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
        {flows.map((flow) => {
          const risk = getOperationalRisk(flow);

          return (
            <article
              key={flow.contact_flow_id}
              className={[
                "grid gap-4 px-5 py-4 transition xl:grid-cols-[1.3fr_1.4fr_1fr_1fr_120px_120px_145px_130px] xl:items-center",
                hasUnreadMessages(flow)
                  ? "bg-emerald-50/60 hover:bg-emerald-50"
                  : "hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    title={getClientFullName(flow.client)}
                    className="truncate text-sm font-semibold text-slate-900"
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
                  onClick={() => onOpenConversation(flow)}
                  className="relative rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Instalación
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/follow-ups/${flow.follow_up.follow_up_id}`;
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Mant.
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export type { ContactFlowSortKey, SortDirection };
