import type { ContactFlowItem, ContactFlowMessage } from "./types";

function getSafeLocale(locale?: string | null) {
  const normalizedLocale = locale?.trim();

  return normalizedLocale || "es";
}

export function formatDate(value: string | null, locale = "es") {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(getSafeLocale(locale), {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }
}

export function formatDateTime(value: string | null, locale = "es") {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(getSafeLocale(locale), {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
}

export function getClientFullName(client: ContactFlowItem["client"]) {
  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export function getStatusLabel(status: ContactFlowItem["status"]) {
  switch (status) {
    case "WAITING_RESPONSE":
      return "Esperando respuesta";
    case "OPTIONS_SENT":
      return "Opciones enviadas";
    case "CONFIRMED":
      return "Confirmado";
    case "MANUAL_REQUIRED":
      return "Requiere gestión";
    case "REJECTED":
      return "Rechazado";
    case "NO_RESPONSE":
      return "Sin respuesta";
    case "MESSAGE_SENT":
      return "Mensaje enviado";
    case "DATE_SELECTED":
      return "Fecha seleccionada";
    case "CLOSED":
      return "Cerrado";
    default:
      return "Pendiente";
  }
}

export function getStatusClasses(status: ContactFlowItem["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "WAITING_RESPONSE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "OPTIONS_SENT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "MANUAL_REQUIRED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "NO_RESPONSE":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function getOperationalRisk(flow: ContactFlowItem) {
  if (flow.requires_manual_action || flow.status === "MANUAL_REQUIRED") {
    return {
      label: "Atención requerida",
      classes: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (flow.status === "WAITING_RESPONSE" || flow.status === "OPTIONS_SENT") {
    return {
      label: "Seguimiento pendiente",
      classes: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (flow.status === "CONFIRMED") {
    return {
      label: "Confirmado",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "En proceso",
    classes: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

export function getMessageTypeLabel(direction?: "OUTBOUND" | "INBOUND") {
  if (direction === "OUTBOUND") return "🤖 Enviado";
  if (direction === "INBOUND") return "👤 Cliente";
  return "Sin actividad";
}

export function getDeliveryLabel(status?: string | null) {
  switch (status) {
    case "queued":
    case "QUEUED":
      return "En cola";
    case "sent":
    case "SENT":
      return "Enviado";
    case "delivered":
    case "DELIVERED":
      return "Entregado";
    case "read":
    case "READ":
      return "Leído";
    case "failed":
    case "FAILED":
      return "Fallido";
    case "received":
    case "RECEIVED":
      return "Recibido";
    default:
      return "Sin estado";
  }
}

export function getLastMessagePreview(
  message: ContactFlowItem["last_message"],
) {
  if (!message) return "Aún no hay mensajes registrados.";

  if (message.message_type === "image") return "📷 Imagen";
  if (message.message_type === "document") return "📄 Documento";

  return message.message_text || "Mensaje sin texto.";
}

export function hasUnreadMessages(flow: ContactFlowItem) {
  return Boolean(flow.has_unread_messages && flow.unread_count);
}

function getMetadataStringValue(
  metadata: ContactFlowMessage["metadata"],
  keys: string[],
) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const metadataRecord = metadata as Record<string, unknown>;

  for (const key of keys) {
    const value = metadataRecord[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function getMessageMediaUrl(message: ContactFlowMessage) {
  return getMetadataStringValue(message.metadata, [
    "mediaUrl",
    "media_url",
    "url",
    "fileUrl",
    "file_url",
  ]);
}

export function getMessageFileName(message: ContactFlowMessage) {
  const fileName = getMetadataStringValue(message.metadata, [
    "fileName",
    "file_name",
    "filename",
    "documentName",
    "document_name",
    "name",
  ]);

  if (fileName) {
    return fileName;
  }

  const mediaUrl = getMessageMediaUrl(message);

  if (mediaUrl) {
    const cleanUrl = mediaUrl.split("?")[0] || "";
    const urlParts = cleanUrl.split("/");
    const lastPart = urlParts.at(-1);

    if (lastPart?.trim()) {
      try {
        return decodeURIComponent(lastPart);
      } catch {
        return lastPart;
      }
    }
  }

  return "Documento";
}
