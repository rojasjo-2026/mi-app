import type {
  ContactFlowItem,
  ContactFlowMessage,
  ContactFlowStatus,
} from "./contactFlowTypes";

export function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function calculateEstimatedTriggerDate(
  targetDate: string | null,
  daysBefore: number | null | undefined,
) {
  if (!targetDate) return null;

  const date = new Date(targetDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const normalizedDaysBefore = Number.isFinite(Number(daysBefore))
    ? Math.trunc(Number(daysBefore))
    : 22;

  date.setDate(date.getDate() - normalizedDaysBefore);
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

export function getStatusLabel(status: ContactFlowStatus) {
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

export function getStatusClasses(status: ContactFlowStatus) {
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
  if (direction === "OUTBOUND") return "Mensaje enviado";
  if (direction === "INBOUND") return "Respuesta del cliente";
  return "Sin actividad";
}

export function getMessageMediaUrl(message: ContactFlowMessage) {
  if (!message.metadata) return null;

  const mediaUrl = message.metadata.mediaUrl;

  return typeof mediaUrl === "string" && mediaUrl.trim() ? mediaUrl : null;
}

export function getMessageFileName(message: ContactFlowMessage) {
  if (!message.metadata) return "Documento";

  const filename = message.metadata.filename;

  return typeof filename === "string" && filename.trim()
    ? filename
    : "Documento";
}

export function getDeliveryLabel(status?: string | null) {
  if (status === "read") return "✓✓";
  if (status === "delivered") return "✓✓";
  if (status === "failed") return "!";
  if (status === "sent" || status === "mock-sent") return "✓";

  return "";
}
