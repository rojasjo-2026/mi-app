"use client";

import { useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

import type { ClientActivityLog } from "@/lib/clients/clientDetail.types";
import {
  formatActivityValue,
  formatDateTimeLabel,
  getActivityActionLabel,
  getActivityCategoryClass,
  getActivityCategoryLabel,
  getActivityFieldLabel,
} from "@/lib/clients/clientDetail.utils";

type ClientActivityHistoryProps = {
  activityLogs: ClientActivityLog[];
  loading: boolean;
  error: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  locale?: string;
};

type ActivityMetadata = Record<string, unknown>;

type ClientActivityLogWithMetadata = ClientActivityLog & {
  metadata?: unknown;
};

const WHATSAPP_ACTION_LABELS: Record<string, string> = {
  CONTACT_FLOW_CREATED: "Gestión de WhatsApp iniciada",
  CONTACT_MESSAGE_SENT: "Mensaje enviado",
  CONTACT_MESSAGE_RECEIVED: "Mensaje recibido",
  CONTACT_STATUS_CHANGED: "Estado actualizado",
};

const WHATSAPP_TITLES: Record<string, string> = {
  CONTACT_FLOW_CREATED: "Gestión de contacto por WhatsApp iniciada",
  CONTACT_MESSAGE_SENT: "Mensaje de WhatsApp enviado",
  CONTACT_MESSAGE_RECEIVED: "Mensaje de WhatsApp recibido",
  CONTACT_STATUS_CHANGED: "Estado de contacto actualizado",
};

function getActivityMetadata(activity: ClientActivityLog): ActivityMetadata {
  const metadata = (activity as ClientActivityLogWithMetadata).metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as ActivityMetadata;
}

function getMetadataText(metadata: ActivityMetadata, key: string) {
  const value = metadata[key];

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue || null;
}

function getContactStatusLabel(status?: string | null) {
  switch (status) {
    case "PENDING":
      return "Pendiente";

    case "MESSAGE_SENT":
      return "Mensaje enviado";

    case "WAITING_RESPONSE":
      return "Esperando respuesta";

    case "OPTIONS_SENT":
      return "Opciones enviadas";

    case "DATE_SELECTED":
      return "Fecha seleccionada";

    case "CONFIRMED":
      return "Confirmado";

    case "MANUAL_REQUIRED":
      return "Requiere gestión manual";

    case "NO_RESPONSE":
      return "Sin respuesta";

    case "REJECTED":
      return "Rechazado";

    case "CLOSED":
      return "Cerrado";

    default:
      return status || "Sin estado";
  }
}

function isWhatsAppActivity(activity: ClientActivityLog) {
  return (
    activity.category === "CONTACT" &&
    [
      "CONTACT_FLOW_CREATED",
      "CONTACT_MESSAGE_SENT",
      "CONTACT_MESSAGE_RECEIVED",
      "CONTACT_STATUS_CHANGED",
    ].includes(activity.action)
  );
}

function getDisplayActionLabel(activity: ClientActivityLog) {
  if (isWhatsAppActivity(activity)) {
    return WHATSAPP_ACTION_LABELS[activity.action] || "Evento de WhatsApp";
  }

  return getActivityActionLabel(activity.action);
}

function getDisplayTitle(activity: ClientActivityLog) {
  if (isWhatsAppActivity(activity)) {
    return WHATSAPP_TITLES[activity.action] || activity.title;
  }

  return activity.title;
}

function getDisplayDescription(activity: ClientActivityLog) {
  if (!isWhatsAppActivity(activity)) {
    return activity.description;
  }

  const metadata = getActivityMetadata(activity);
  const messagePreview =
    getMetadataText(metadata, "message_preview") ||
    getMetadataText(metadata, "inbound_message_preview");

  if (activity.action === "CONTACT_FLOW_CREATED") {
    return "Se inició una gestión de contacto por WhatsApp para este mantenimiento.";
  }

  if (activity.action === "CONTACT_MESSAGE_SENT") {
    return messagePreview
      ? `Se envió un mensaje al cliente: "${messagePreview}"`
      : "Se envió un mensaje de WhatsApp al cliente.";
  }

  if (activity.action === "CONTACT_MESSAGE_RECEIVED") {
    return messagePreview
      ? `El cliente respondió por WhatsApp: "${messagePreview}"`
      : "Se recibió un mensaje de WhatsApp del cliente.";
  }

  if (activity.action === "CONTACT_STATUS_CHANGED") {
    const oldStatus = getContactStatusLabel(
      getMetadataText(metadata, "old_status"),
    );
    const newStatus = getContactStatusLabel(
      getMetadataText(metadata, "new_status"),
    );

    return `El estado de la gestión cambió de ${oldStatus} a ${newStatus}.`;
  }

  return activity.description;
}

function getWhatsAppDetails(activity: ClientActivityLog) {
  if (!isWhatsAppActivity(activity)) {
    return null;
  }

  const metadata = getActivityMetadata(activity);

  const messagePreview =
    getMetadataText(metadata, "message_preview") ||
    getMetadataText(metadata, "inbound_message_preview");

  const newStatus = getMetadataText(metadata, "new_status");
  const phoneNumber = getMetadataText(metadata, "phone_number");
  const followUpId = getMetadataText(metadata, "follow_up_id");
  const installationId = getMetadataText(metadata, "installation_id");

  return {
    messagePreview,
    newStatus,
    phoneNumber,
    followUpId,
    installationId,
  };
}

export function ClientActivityHistory({
  activityLogs,
  loading,
  error,
  hasMore,
  onLoadMore,
  locale,
}: ClientActivityHistoryProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = useMemo(
    () => [
      "ALL",
      "INSTALLATION",
      "FILE",
      "FOLLOW_UP",
      "FINANCE",
      "CLIENT",
      "CONTACT",
    ],
    [],
  );

  const filteredLogs = useMemo(
    () =>
      selectedCategory === "ALL"
        ? activityLogs
        : activityLogs.filter(
            (activity) => activity.category === selectedCategory,
          ),
    [activityLogs, selectedCategory],
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6">
        <p className="text-sm font-semibold text-slate-600">
          Cargando historial del cliente...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6">
        <p className="text-sm font-semibold text-red-600">{error}</p>
      </div>
    );
  }

  if (activityLogs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-slate-600">
          Aún no hay eventos registrados.
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Los cambios de clientes, instalaciones, mantenimientos, archivos,
          contactos y finanzas aparecerán aquí automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                category === selectedCategory
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {category === "ALL"
                ? "Todos"
                : getActivityCategoryLabel(category)}
            </button>
          ))}
        </div>

        <p className="text-xs font-medium text-slate-500">
          Mostrando {filteredLogs.length} de {activityLogs.length} eventos
        </p>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-600">
            No hay eventos para este filtro.
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Selecciona otra categoría o vuelve a Todos.
          </p>
        </div>
      ) : (
        <div className="relative space-y-4 pl-6">
          <div className="absolute bottom-0 left-[11px] top-0 w-px bg-slate-200" />

          {filteredLogs.map((activity) => {
            const whatsAppDetails = getWhatsAppDetails(activity);
            const description = getDisplayDescription(activity);

            return (
              <article key={activity.activity_id} className="relative">
                <div className="absolute -left-6 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-white">
                  <Clock3 className="h-3.5 w-3.5" />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getActivityCategoryClass(
                            activity.category,
                          )}`}
                        >
                          {getActivityCategoryLabel(activity.category)}
                        </span>

                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                          {getDisplayActionLabel(activity)}
                        </span>

                        {isWhatsAppActivity(activity) ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                            WhatsApp
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm font-black text-slate-900">
                        {getDisplayTitle(activity)}
                      </p>

                      {description ? (
                        <p className="mt-1 text-sm leading-5 text-slate-600">
                          {description}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-xs font-bold text-slate-500">
                      {formatDateTimeLabel(activity.created_at, locale)}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                      Módulo: {getActivityCategoryLabel(activity.category)}
                    </span>

                    <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                      {isWhatsAppActivity(activity)
                        ? "Canal: WhatsApp"
                        : `Campo: ${getActivityFieldLabel(activity.field_name)}`}
                    </span>

                    <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                      Usuario: {activity.created_by || "Sistema"}
                    </span>
                  </div>

                  {whatsAppDetails ? (
                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-3">
                      <div className="grid gap-2 text-xs font-semibold text-emerald-800 sm:grid-cols-3">
                        <span>
                          Teléfono:{" "}
                          {whatsAppDetails.phoneNumber || "No registrado"}
                        </span>

                        <span>
                          Estado:{" "}
                          {whatsAppDetails.newStatus
                            ? getContactStatusLabel(whatsAppDetails.newStatus)
                            : "No aplica"}
                        </span>

                        <span className="truncate">
                          Mensaje:{" "}
                          {whatsAppDetails.messagePreview || "No aplica"}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {whatsAppDetails?.followUpId ? (
                    <details className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <summary className="cursor-pointer text-sm font-bold text-slate-700">
                        Ver contexto operativo
                      </summary>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            Mantenimiento
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                            {whatsAppDetails.followUpId}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            Instalación
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                            {whatsAppDetails.installationId || "No registrada"}
                          </p>
                        </div>
                      </div>
                    </details>
                  ) : null}

                  {activity.old_value || activity.new_value ? (
                    <details className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <summary className="cursor-pointer text-sm font-bold text-slate-700">
                        Ver cambios
                      </summary>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            Antes
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                            {formatActivityValue(
                              activity.old_value,
                              activity.field_name,
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            Después
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                            {formatActivityValue(
                              activity.new_value,
                              activity.field_name,
                            )}
                          </p>
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasMore && onLoadMore ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mostrar más
          </button>
        </div>
      ) : null}
    </div>
  );
}
