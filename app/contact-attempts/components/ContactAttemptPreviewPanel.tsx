"use client";

import { useEffect, useRef } from "react";

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
  onClose: () => void;
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
    <div className="grid grid-cols-[108px_minmax(0,1fr)] gap-3 py-2.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p
        title={displayValue}
        className="min-w-0 truncate text-right text-sm font-medium text-slate-800"
      >
        {displayValue}
      </p>
    </div>
  );
}

function OperationalRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <div className="min-w-0 text-right">
        <p
          title={value}
          className="truncate text-sm font-semibold text-slate-900"
        >
          {value}
        </p>

        {helper ? (
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{helper}</p>
        ) : null}
      </div>
    </div>
  );
}

function getOperationalZoneName(flow: ContactFlowItem) {
  return (
    flow.follow_up.operational_zone?.name ||
    flow.installation?.operational_zone?.name ||
    flow.client.operational_zone?.name ||
    "Sin zona operativa"
  );
}

export function ContactAttemptPreviewPanel({
  flow,
  onClose,
  onOpenConversation,
}: ContactAttemptPreviewPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!flow) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) return;
      if (panelRef.current?.contains(target)) return;
      if (target.closest('[data-contact-attempt-row="true"]')) return;

      onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [flow, onClose]);

  if (!flow) {
    return null;
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
  const operationalZoneName = getOperationalZoneName(flow);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label={`Detalle del intento de ${clientName}`}
        className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-[430px] flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Detalle del intento
              </p>

              <h2
                title={clientName}
                className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950"
              >
                {clientName}
              </h2>

              {flow.client.phone_primary ? (
                <a
                  href={`tel:${flow.client.phone_primary}`}
                  className="mt-1 inline-flex cursor-pointer text-xs font-medium text-slate-500 transition hover:text-blue-700"
                >
                  {flow.client.phone_primary}
                </a>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Sin teléfono</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {unread ? (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                {flow.unread_count}
              </span>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              title="Cerrar"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-lg leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="flex flex-wrap gap-1.5">
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
            <p className="mb-2 text-xs font-semibold text-slate-700">
              Acciones rápidas
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onOpenConversation(flow)}
                className="col-span-2 inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Ver conversación
              </button>

              {flow.installation?.installation_id ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/installations/${flow.installation?.installation_id}`;
                  }}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Ver instalación
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  window.location.href = `/follow-ups/${flow.follow_up.follow_up_id}`;
                }}
                className={[
                  "inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100",
                  flow.installation?.installation_id ? "" : "col-span-2",
                ].join(" ")}
              >
                Ver mantenimiento
              </button>

              <button
                type="button"
                disabled
                title="Pendiente de conexión con backend"
                className="col-span-2 inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-400"
              >
                Marcar como gestionado
              </button>
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold text-slate-700">
              Situación operativa
            </p>

            <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white px-3">
              <OperationalRow
                label="Fecha objetivo"
                value={targetDate}
                helper="Objetivo del contacto"
              />
              <OperationalRow
                label="Fecha agendada"
                value={selectedDate}
                helper="Fecha elegida"
              />
              <OperationalRow
                label="Última interacción"
                value={lastInteraction}
                helper={lastMessageType}
              />
              <OperationalRow
                label="Estado"
                value={getStatusLabel(flow.status)}
                helper="Contacto"
              />
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold text-slate-700">
              Información general
            </p>

            <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white px-3">
              <DetailRow label="Instalación" value={installationName} />
              <DetailRow label="Zona operativa" value={operationalZoneName} />
              <DetailRow label="Objetivo" value="Conversación" />
              <DetailRow label="Motivo" value={reason} />
              <DetailRow label="Canal" value="WhatsApp" />
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold text-slate-700">
              Último mensaje
            </p>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="line-clamp-4 text-sm leading-5 text-slate-700">
                {lastMessage}
              </p>

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                <p className="text-xs font-medium text-slate-600">
                  {lastMessageType}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {lastInteraction}
                </p>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
