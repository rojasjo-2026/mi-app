import { MaintenanceContactFlowStatus } from "@prisma/client";

import {
  buildAutomaticReplyMessage,
  buildInitialContactMessageTemplate,
  buildReminderMessageTemplate,
} from "@/lib/services/contact-flow/contactFlowMessageTemplatesService";

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
      status: "MANUAL_REQUIRED",
      requiresManualAction: true,
      manualReason:
        "El cliente confirmó disponibilidad. Se debe validar agenda, zona operativa y capacidad antes de confirmar el mantenimiento.",
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
  return buildInitialContactMessageTemplate(params);
}

export function buildReminderMessage(params: {
  clientName?: string;
  installationName?: string;
}) {
  return buildReminderMessageTemplate(params);
}

export function buildAutomaticReply(params: {
  messageText: string;
  clientName?: string | null;
  installationName?: string | null;
  scheduledDate?: Date | string | null;
}) {
  const automationResult = resolveInboundFlowUpdate(params.messageText);

  return buildAutomaticReplyMessage({
    automationResult,
    clientName: params.clientName,
    installationName: params.installationName,
    scheduledDate: params.scheduledDate,
  });
}
