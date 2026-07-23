import { resolveAppSettings } from "@/lib/config/app-settings";

type ContactFlowReplyAutomationResult = {
  status: string;
  manualReason?: string | null;
};

type ContactFlowMessageContext = {
  clientName?: string | null;
  installationName?: string | null;
  scheduledDate?: Date | string | null;
  locale?: string | null;
  countryCode?: string | null;
};

export type ContactFlowDateMessageOption = {
  option: number;
  date: Date | string;
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

/**
 * Construye el mensaje con las fechas que ya fueron filtradas por el motor
 * de disponibilidad.
 *
 * Esta función no limita la cantidad de opciones. Muestra exactamente las
 * fechas que reciba desde la configuración y el servicio de sugerencias.
 */
export function buildContactFlowDateOptionsMessageTemplate(
  params: {
    options: ContactFlowDateMessageOption[];
  } & Omit<ContactFlowMessageContext, "scheduledDate">,
) {
  const firstName = params.clientName?.trim() || "cliente";
  const installationLabel = params.installationName?.trim() || "su instalación";

  const optionLines = [...params.options]
    .filter(
      (option) =>
        Number.isSafeInteger(option.option) &&
        option.option > 0 &&
        Boolean(
          formatReplyDate(option.date, params.locale, params.countryCode),
        ),
    )
    .sort((left, right) => left.option - right.option)
    .map((option) => {
      const dateLabel = formatReplyDate(
        option.date,
        params.locale,
        params.countryCode,
      );

      return `${option.option}. ${dateLabel}`;
    });

  if (optionLines.length === 0) {
    return buildContactFlowNoAvailableDatesMessageTemplate({
      clientName: firstName,
      installationName: installationLabel,
    });
  }

  return `Hola ${firstName},

Estas son las fechas disponibles actualmente para coordinar el mantenimiento de ${installationLabel} en su zona:

${optionLines.join("\n")}

Por favor responda con el número de la fecha que prefiere.

La fecha seleccionada quedará pendiente de revisión y confirmación final por parte de nuestro equipo.`;
}

/**
 * Confirma únicamente que la preferencia del cliente fue registrada.
 * No informa que la visita quedó programada o confirmada.
 */
export function buildContactFlowDatePreferenceReceivedMessageTemplate(
  params: {
    selectedDate: Date | string;
  } & Omit<ContactFlowMessageContext, "scheduledDate">,
) {
  const firstName = params.clientName?.trim() || "cliente";
  const installationLabel = params.installationName?.trim() || "su instalación";
  const dateLabel = formatReplyDate(
    params.selectedDate,
    params.locale,
    params.countryCode,
  );

  if (!dateLabel) {
    return `Hola ${firstName}, registramos su preferencia de fecha para el mantenimiento de ${installationLabel}. Nuestro equipo revisará la programación y le enviará la confirmación final.`;
  }

  return `Hola ${firstName}, registramos su fecha preferida para el mantenimiento de ${installationLabel}: ${dateLabel}.

Nuestro equipo revisará la programación y le enviará la confirmación final.`;
}

/**
 * Se utiliza cuando la zona no tiene fechas configuradas disponibles o
 * cuando ninguna de ellas pasa las reglas actuales de disponibilidad.
 */
export function buildContactFlowNoAvailableDatesMessageTemplate(params: {
  clientName?: string | null;
  installationName?: string | null;
}) {
  const firstName = params.clientName?.trim() || "cliente";
  const installationLabel = params.installationName?.trim() || "su instalación";

  return `Hola ${firstName}, en este momento no encontramos fechas disponibles para coordinar el mantenimiento de ${installationLabel} en su zona.

Nuestro equipo revisará el caso y le contactará para continuar con la coordinación.`;
}

/**
 * Se utiliza cuando el cliente elige una opción que perdió disponibilidad
 * antes de que su respuesta fuera procesada.
 */
export function buildContactFlowSelectedDateUnavailableMessageTemplate(
  params: {
    selectedDate?: Date | string | null;
  } & Omit<ContactFlowMessageContext, "scheduledDate">,
) {
  const firstName = params.clientName?.trim() || "cliente";
  const installationLabel = params.installationName?.trim() || "su instalación";
  const dateLabel = formatReplyDate(
    params.selectedDate,
    params.locale,
    params.countryCode,
  );

  return `Hola ${firstName}, la fecha que seleccionó${
    dateLabel ? ` (${dateLabel})` : ""
  } ya no se encuentra disponible para el mantenimiento de ${installationLabel}.

Nuestro equipo revisará nuevas opciones y le contactará para continuar con la coordinación.`;
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
    const dateLabel = formatReplyDate(
      params.scheduledDate,
      params.locale,
      params.countryCode,
    );

    return `Hola ${firstName}, recibimos su confirmación de disponibilidad para el mantenimiento de ${installationLabel}${
      dateLabel ? `, previsto para el ${dateLabel}` : ""
    }. Antes de confirmar la visita, nuestro equipo validará la agenda, la zona operativa y la capacidad disponible. Le contactaremos con la confirmación final o con una fecha segura disponible.`;
  }

  if (params.automationResult.status === "CONFIRMED") {
    const dateLabel = formatReplyDate(
      params.scheduledDate,
      params.locale,
      params.countryCode,
    );

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

function getReplyLocale(locale?: string | null, countryCode?: string | null) {
  if (locale?.trim()) {
    return locale.trim();
  }

  return resolveAppSettings(
    countryCode
      ? {
          country_code: countryCode,
        }
      : undefined,
  ).locale;
}

function formatReplyDate(
  value?: Date | string | null,
  locale?: string | null,
  countryCode?: string | null,
) {
  if (!value) return null;

  const date = parseReplyDate(value);

  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat(getReplyLocale(locale, countryCode), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: isDateOnlyValue(value) ? "UTC" : undefined,
  }).format(date);
}

function parseReplyDate(value: Date | string) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      return null;
    }

    return parsedDate;
  }

  const parsedDate = new Date(trimmedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isDateOnlyValue(value: Date | string) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}
