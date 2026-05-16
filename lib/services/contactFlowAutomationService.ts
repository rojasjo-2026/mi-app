import { MaintenanceContactFlowStatus } from "@prisma/client";

export type AutomationResult = {
  status: MaintenanceContactFlowStatus;
  requiresManualAction: boolean;
  manualReason: string | null;
  selectedDate: Date | null;
  shouldClose: boolean;
};

function normalizeMessage(messageText: string) {
  return messageText
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function resolveInboundFlowUpdate(
  messageText: string,
): AutomationResult {
  const normalized = normalizeMessage(messageText);

  if (
    ["1", "si", "ok", "dale", "confirmo", "confirmar", "confirmado"].includes(
      normalized,
    ) ||
    includesAny(normalized, ["perfecto", "de acuerdo", "esta bien"])
  ) {
    return {
      status: "CONFIRMED",
      requiresManualAction: false,
      manualReason: null,
      selectedDate: null,
      shouldClose: false,
    };
  }

  if (
    includesAny(normalized, [
      "2",
      "reprogramar",
      "cambiar",
      "otra fecha",
      "otro dia",
      "no puedo",
      "posponer",
      "mover",
    ])
  ) {
    return {
      status: "MANUAL_REQUIRED",
      requiresManualAction: true,
      manualReason: "El cliente solicitó reprogramar el mantenimiento.",
      selectedDate: null,
      shouldClose: false,
    };
  }

  if (
    includesAny(normalized, [
      "3",
      "no me interesa",
      "no quiero",
      "cancelar",
      "rechazar",
      "no gracias",
      "ya no",
    ])
  ) {
    return {
      status: "REJECTED",
      requiresManualAction: false,
      manualReason:
        "El cliente indicó que no desea continuar con el mantenimiento.",
      selectedDate: null,
      shouldClose: true,
    };
  }

  if (
    includesAny(normalized, [
      "4",
      "asesor",
      "agente",
      "persona",
      "humano",
      "llamar",
      "llamada",
      "hablar",
      "contactenme",
      "contacteme",
    ])
  ) {
    return {
      status: "MANUAL_REQUIRED",
      requiresManualAction: true,
      manualReason: "El cliente solicitó hablar con un asesor.",
      selectedDate: null,
      shouldClose: false,
    };
  }

  return {
    status: "MANUAL_REQUIRED",
    requiresManualAction: true,
    manualReason: "El mensaje recibido no pudo clasificarse automáticamente.",
    selectedDate: null,
    shouldClose: false,
  };
}

export function buildInitialContactMessage(params: {
  clientName?: string;
  installationName?: string;
}) {
  const clientName = params.clientName?.trim() || "cliente";
  const installationName = params.installationName?.trim() || "su instalación";

  return `Hola ${clientName},

Le contactamos porque el mantenimiento de ${installationName} se aproxima.

Por favor responda con una de las siguientes opciones:

1. Confirmar mantenimiento
2. Reprogramar
3. Ya no me interesa
4. Hablar con un asesor`;
}

export function buildReminderMessage(params: { clientName?: string }) {
  const clientName = params.clientName?.trim() || "cliente";

  return `Hola ${clientName},

Le damos seguimiento a su mantenimiento pendiente.

Por favor responda con una de las siguientes opciones:

1. Confirmar mantenimiento
2. Reprogramar
3. Ya no me interesa
4. Hablar con un asesor`;
}

export function buildAutomaticReply(params: {
  messageText: string;
  clientName?: string | null;
  installationName?: string | null;
  scheduledDate?: Date | string | null;
}) {
  const result = resolveInboundFlowUpdate(params.messageText);
  const firstName = params.clientName?.trim() || "cliente";
  const installationLabel = params.installationName?.trim() || "su instalación";

  if (result.status === "CONFIRMED") {
    const dateLabel = formatReplyDate(params.scheduledDate);

    return `Hola ${firstName}, su mantenimiento para ${installationLabel} quedó confirmado correctamente${
      dateLabel ? ` para el ${dateLabel}` : ""
    }. Le estaremos contactando si necesitamos coordinar algún detalle adicional.`;
  }

  if (
    result.status === "MANUAL_REQUIRED" &&
    result.manualReason?.includes("reprogramar")
  ) {
    return `Hola ${firstName}, recibimos su solicitud para reprogramar el mantenimiento de ${installationLabel}. Un asesor le contactará para coordinar una nueva fecha.`;
  }

  if (result.status === "REJECTED") {
    return `Hola ${firstName}, registramos que no desea continuar con el seguimiento del mantenimiento de ${installationLabel}. Si necesita ayuda más adelante, con gusto le atenderemos.`;
  }

  if (
    result.status === "MANUAL_REQUIRED" &&
    result.manualReason?.includes("asesor")
  ) {
    return `Hola ${firstName}, recibimos su solicitud para hablar con un asesor. Un miembro del equipo le contactará pronto sobre ${installationLabel}.`;
  }

  return `Hola ${firstName}, recibimos su mensaje. Un miembro del equipo lo revisará y continuará con el seguimiento de ${installationLabel}.`;
}

function formatReplyDate(value?: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
