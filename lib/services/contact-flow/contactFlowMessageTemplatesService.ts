type ContactFlowReplyAutomationResult = {
  status: string;
  manualReason?: string | null;
};

type ContactFlowMessageContext = {
  clientName?: string | null;
  installationName?: string | null;
  scheduledDate?: Date | string | null;
};

export function buildInitialContactMessageTemplate(params: {
  clientName?: string;
  installationName?: string;
}) {
  const clientName = params.clientName?.trim() || "cliente";
  const installationName = params.installationName?.trim() || "su instalación";

  return `Hola ${clientName},

Le contactamos de CLARIUS para coordinar el mantenimiento de ${installationName}.

Para continuar, por favor responda con una de las siguientes opciones:

1. Confirmar disponibilidad
2. Solicitar otra fecha
3. Ya no me interesa
4. Hablar con un asesor`;
}

export function buildReminderMessageTemplate(params: {
  clientName?: string;
  installationName?: string;
}) {
  const clientName = params.clientName?.trim() || "cliente";
  const installationName = params.installationName?.trim() || "su instalación";

  return `Hola ${clientName},

Le damos seguimiento al mantenimiento pendiente de ${installationName}.

Para continuar, por favor responda con una de las siguientes opciones:

1. Confirmar disponibilidad
2. Solicitar otra fecha
3. Ya no me interesa
4. Hablar con un asesor`;
}

export function buildAutomaticReplyMessage(
  params: {
    automationResult: ContactFlowReplyAutomationResult;
  } & ContactFlowMessageContext,
) {
  const firstName = params.clientName?.trim() || "cliente";
  const installationLabel = params.installationName?.trim() || "su instalación";
  const manualReason = params.automationResult.manualReason || "";

  if (
    params.automationResult.status === "MANUAL_REQUIRED" &&
    (manualReason.includes("confirmó disponibilidad") ||
      manualReason.includes("validar agenda"))
  ) {
    const dateLabel = formatReplyDate(params.scheduledDate);

    return `Hola ${firstName}, recibimos su confirmación de disponibilidad para el mantenimiento de ${installationLabel}${
      dateLabel ? `, previsto para el ${dateLabel}` : ""
    }. Antes de confirmar la visita, nuestro equipo validará la agenda, la zona operativa y la capacidad disponible. Le contactaremos con la confirmación final o con una fecha segura disponible.`;
  }

  if (params.automationResult.status === "CONFIRMED") {
    const dateLabel = formatReplyDate(params.scheduledDate);

    return `Hola ${firstName}, su mantenimiento para ${installationLabel} quedó confirmado correctamente${
      dateLabel ? ` para el ${dateLabel}` : ""
    }. Le estaremos contactando si necesitamos coordinar algún detalle adicional.`;
  }

  if (
    params.automationResult.status === "MANUAL_REQUIRED" &&
    manualReason.includes("reprogramar")
  ) {
    return `Hola ${firstName}, recibimos su solicitud para coordinar otra fecha para el mantenimiento de ${installationLabel}. Un asesor revisará la agenda disponible y le contactará para ofrecerle una opción segura.`;
  }

  if (params.automationResult.status === "REJECTED") {
    return `Hola ${firstName}, registramos que no desea continuar con el seguimiento del mantenimiento de ${installationLabel}. Si necesita ayuda más adelante, con gusto le atenderemos.`;
  }

  if (
    params.automationResult.status === "MANUAL_REQUIRED" &&
    manualReason.includes("asesor")
  ) {
    return `Hola ${firstName}, recibimos su solicitud para hablar con un asesor. Un miembro del equipo le contactará pronto para darle seguimiento a ${installationLabel}.`;
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
