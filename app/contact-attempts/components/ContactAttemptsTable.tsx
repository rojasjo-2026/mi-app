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
  selectedFlowId: string | null;
  sortKey: ContactFlowSortKey;
  sortDirection: SortDirection;
  viewMode?: "list" | "grid";
  onSort: (sortKey: ContactFlowSortKey) => void;
  onSelectFlow: (flow: ContactFlowItem) => void;
  onOpenConversation: (flow: ContactFlowItem) => void;
};

const SORTABLE_HEADERS: {
  key: ContactFlowSortKey | null;
  label: string;
}[] = [
  { key: "client", label: "Cliente" },
  { key: "installation", label: "Instalación" },
  { key: null, label: "Zona operativa" },
  { key: "status", label: "Estado" },
  { key: "risk", label: "Riesgo" },
  { key: "targetDate", label: "Objetivo" },
  { key: "selectedDate", label: "Agendada" },
  { key: "lastInteraction", label: "Última interacción" },
  { key: null, label: "" },
];

const TABLE_GRID_COLUMNS =
  "xl:grid-cols-[1.2fr_1.25fr_180px_0.85fr_0.85fr_110px_110px_145px_56px]";

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}

function getOperationalZoneName(flow: ContactFlowItem) {
  return (
    flow.follow_up.operational_zone?.name ||
    flow.installation?.operational_zone?.name ||
    flow.client.operational_zone?.name ||
    "Sin zona operativa"
  );
}

export function ContactAttemptsTable({
  flows,
  selectedFlowId,
  sortKey,
  sortDirection,
  onSort,
  onSelectFlow,
  onOpenConversation,
}: ContactAttemptsTableProps) {
  function getSortIndicator(headerKey: ContactFlowSortKey | null) {
    if (!headerKey) return null;

    if (headerKey !== sortKey) {
      return "↕";
    }

    return sortDirection === "asc" ? "↑" : "↓";
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[640px] min-h-[380px] overflow-auto overscroll-contain [scrollbar-gutter:stable]">
        <div
          className={[
            "sticky top-0 z-20 hidden min-w-[1380px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 xl:grid",
            TABLE_GRID_COLUMNS,
          ].join(" ")}
        >
          {SORTABLE_HEADERS.map((header) => (
            <button
              key={header.label || "actions"}
              type="button"
              disabled={!header.key}
              title={header.key ? `Ordenar por ${header.label}` : undefined}
              onClick={() => {
                if (header.key) {
                  onSort(header.key);
                }
              }}
              className={[
                "flex min-w-0 items-center gap-1.5 whitespace-nowrap text-left text-[11px] font-extrabold uppercase tracking-[0.1em]",
                header.key
                  ? "cursor-pointer transition hover:text-slate-800"
                  : "cursor-default",
                header.key === sortKey ? "text-slate-800" : "text-slate-500",
              ].join(" ")}
            >
              <span>{header.label}</span>

              {header.key ? (
                <span
                  className={[
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none",
                    header.key === sortKey
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                >
                  {getSortIndicator(header.key)}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="min-w-[1380px] divide-y divide-slate-100">
          {flows.map((flow) => {
            const risk = getOperationalRisk(flow);
            const clientName = getClientFullName(flow.client);
            const selected = flow.contact_flow_id === selectedFlowId;
            const initials = getInitials(clientName);
            const unread = hasUnreadMessages(flow);
            const operationalZoneName = getOperationalZoneName(flow);

            return (
              <article
                key={flow.contact_flow_id}
                role="button"
                tabIndex={0}
                data-contact-attempt-row="true"
                aria-pressed={selected}
                onClick={() => onSelectFlow(flow)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectFlow(flow);
                  }
                }}
                className={[
                  "group grid cursor-pointer gap-4 border-l-2 px-4 py-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300",
                  TABLE_GRID_COLUMNS,
                  "xl:items-center",
                  selected
                    ? "border-l-blue-600 bg-blue-50 ring-1 ring-inset ring-blue-200"
                    : unread
                      ? "border-l-emerald-400 bg-emerald-50/25 hover:bg-emerald-50/50"
                      : "border-l-transparent bg-white hover:bg-slate-50",
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold transition",
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
                    ].join(" ")}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        title={clientName}
                        className="truncate text-sm font-semibold text-slate-900"
                      >
                        {clientName}
                      </p>

                      {unread ? (
                        <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {flow.unread_count}
                        </span>
                      ) : null}
                    </div>

                    <p
                      title={flow.client.phone_primary || "Sin teléfono"}
                      className="mt-1 truncate text-xs font-medium text-slate-500"
                    >
                      {flow.client.phone_primary || "Sin teléfono"}
                    </p>
                  </div>
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

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400 xl:hidden">
                    Zona operativa
                  </p>

                  <p
                    title={operationalZoneName}
                    className={[
                      "truncate text-sm font-medium",
                      operationalZoneName === "Sin zona operativa"
                        ? "text-slate-400"
                        : "text-slate-800",
                    ].join(" ")}
                  >
                    {operationalZoneName}
                  </p>
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(
                      flow.status,
                    )}`}
                  >
                    {getStatusLabel(flow.status)}
                  </span>
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${risk.classes}`}
                  >
                    {risk.label}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400 xl:hidden">
                    Fecha objetivo
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(flow.follow_up.target_date)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400 xl:hidden">
                    Fecha agendada
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(
                      flow.selected_date || flow.follow_up.scheduled_date,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400 xl:hidden">
                    Última interacción
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {formatDateTime(flow.last_message_at)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {getMessageTypeLabel(flow.last_message?.direction)}
                  </p>

                  {flow.last_message ? (
                    <p
                      title={getLastMessagePreview(flow.last_message)}
                      className="mt-1 line-clamp-1 text-xs text-slate-500"
                    >
                      {getLastMessagePreview(flow.last_message)}
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    title="Abrir conversación"
                    aria-label={`Abrir conversación con ${clientName}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenConversation(flow);
                    }}
                    className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    💬
                    {unread ? (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                        {flow.unread_count}
                      </span>
                    ) : null}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export type { ContactFlowSortKey, SortDirection };
