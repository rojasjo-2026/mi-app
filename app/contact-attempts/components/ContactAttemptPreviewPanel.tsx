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

type ContactAttemptPreviewPanelProps = {
  flow: ContactFlowItem | null;
  onOpenConversation: (flow: ContactFlowItem) => void;
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : String(value);

  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p
        title={displayValue}
        className="truncate text-sm font-medium text-slate-800"
      >
        {displayValue}
      </p>
    </div>
  );
}

function SmallStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        title={value}
        className="mt-1 truncate text-sm font-semibold text-slate-950"
      >
        {value}
      </p>

      {helper && (
        <p className="mt-1 truncate text-xs font-medium text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
}

export function ContactAttemptPreviewPanel({
  flow,
  onOpenConversation,
}: ContactAttemptPreviewPanelProps) {
  if (!flow) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-semibold text-slate-800">
          Detalle del intento
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona un contacto de la lista para ver el estado, último mensaje
          y acciones rápidas.
        </p>
      </aside>
    );
  }

  const clientName = getClientFullName(flow.client);
  const initials = getInitials(clientName);
  const risk = getOperationalRisk(flow);
  const unread = hasUnreadMessages(flow);
  const installationName =
    flow.installation?.description || "Instalación sin descripción";
  const reason = flow.follow_up.reason || "Sin motivo registrado";
  const lastMessage = getLastMessagePreview(flow.last_message);
  const lastMessageType = getMessageTypeLabel(flow.last_message?.direction);
  const targetDate = formatDate(flow.follow_up.target_date);
  const selectedDate = formatDate(
    flow.selected_date || flow.follow_up.scheduled_date,
  );
  const lastInteraction = formatDateTime(flow.last_message_at);

  return (
    <aside className="sticky top-6 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Detalle del intento
            </p>

            <h2
              title={clientName}
              className="mt-1 truncate text-base font-semibold tracking-tight text-slate-950"
            >
              {clientName}
            </h2>

            <p
              title={flow.client.phone_primary}
              className="mt-1 truncate text-sm text-slate-500"
            >
              {flow.client.phone_primary || "Sin teléfono"}
            </p>
          </div>
        </div>

        {unread && (
          <span className="shrink-0 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
            {flow.unread_count}
          </span>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(
              flow.status,
            )}`}
          >
            {getStatusLabel(flow.status)}
          </span>

          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${risk.classes}`}
          >
            {risk.label}
          </span>

          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            WhatsApp
          </span>
        </div>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Acciones rápidas
          </p>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => onOpenConversation(flow)}
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ver conversación
            </button>

            {flow.installation?.installation_id && (
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/installations/${flow.installation?.installation_id}`;
                }}
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Ver instalación
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                window.location.href = `/follow-ups/${flow.follow_up.follow_up_id}`;
              }}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver mantenimiento
            </button>

            <button
              type="button"
              disabled
              title="Pendiente de conexión con backend"
              className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
            >
              Marcar como gestionado
            </button>
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Situación operativa
          </p>

          <div className="grid grid-cols-2 gap-2">
            <SmallStat
              label="Objetivo"
              value={targetDate}
              helper="Fecha objetivo"
            />
            <SmallStat
              label="Agendada"
              value={selectedDate}
              helper="Fecha elegida"
            />
            <SmallStat
              label="Interacción"
              value={lastInteraction}
              helper={lastMessageType}
            />
            <SmallStat
              label="Estado"
              value={getStatusLabel(flow.status)}
              helper="Contacto"
            />
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Información general
          </p>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-3">
            <DetailRow label="Instalación" value={installationName} />
            <DetailRow label="Objetivo" value="Conversación" />
            <DetailRow label="Motivo" value={reason} />
            <DetailRow label="Canal" value="WhatsApp" />
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Último mensaje
          </p>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
            <p className="line-clamp-4 text-sm leading-6 text-slate-700">
              {lastMessage}
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-emerald-700">
                {lastMessageType}
              </p>

              <p className="truncate text-xs text-slate-500">
                {lastInteraction}
              </p>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
