import { Prisma } from "@prisma/client";

import {
  evaluateAvailabilityForDate,
  type AvailabilityDateEvaluationResult,
} from "@/lib/availability/availability.service";
import { findOperationalZoneById } from "@/lib/operational-zones/operationalZones.repository";
import {
  getOperationalZoneVisitDateSuggestions,
  type OperationalZoneVisitDateSuggestion,
} from "@/lib/operational-zones/operationalZoneVisitDateSuggestions.service";
import { prisma } from "@/lib/prisma";

export const CONTACT_FLOW_DATE_OPTIONS_PURPOSE =
  "OPERATIONAL_ZONE_DATE_OPTIONS" as const;

export type ContactFlowDateOption = {
  option: number;
  date: string;
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
  reason: string;
};

export type ContactFlowDateOptionsConfig = {
  /**
   * null o undefined: devuelve todas las fechas disponibles.
   * Un entero positivo: limita la cantidad de opciones.
   *
   * Este valor puede resolverse posteriormente desde Configuración.
   */
  maxOptions?: number | null;
};

export type ContactFlowDateOptionsMetadata = {
  purpose: typeof CONTACT_FLOW_DATE_OPTIONS_PURPOSE;
  source: "operational-zone-visit-dates";
  operational_zone_id: string;
  generated_at: string;
  option_count: number;
  option_limit: number | null;
  option_map: ContactFlowDateOption[];
};

export type GetContactFlowDateOptionsResult =
  | {
      success: true;
      contactFlowId: string;
      operationalZoneId: string;
      options: ContactFlowDateOption[];
      maxOptions: number | null;
    }
  | {
      success: false;
      reason: string;
    };

export type ResolveContactFlowDateSelectionResult =
  | {
      success: true;
      selectedDate: Date;
      selectedOption: ContactFlowDateOption;
      availability: AvailabilityDateEvaluationResult;
    }
  | {
      success: false;
      reason: string;
    };

type LatestDateOptionsMessage = {
  messageId: string;
  createdAt: Date;
  metadata: ContactFlowDateOptionsMetadata;
};

/**
 * Obtiene fechas configuradas y realmente disponibles para la zona del flujo.
 *
 * getOperationalZoneVisitDateSuggestions ya:
 * - excluye fechas inactivas;
 * - excluye fechas vencidas;
 * - evalúa cada fecha con evaluateAvailabilityForDate;
 * - devuelve solamente can_offer_day = true.
 *
 * Este servicio no impone una cantidad fija. El llamador puede enviar
 * maxOptions según la configuración del negocio. Si no lo envía, se
 * devuelven todas las fechas disponibles.
 */
export async function getContactFlowDateOptions(
  contactFlowId: string,
  config: ContactFlowDateOptionsConfig = {},
): Promise<GetContactFlowDateOptionsResult> {
  const normalizedContactFlowId = contactFlowId.trim();

  if (!normalizedContactFlowId) {
    return {
      success: false,
      reason: "El identificador del flujo de contacto es requerido.",
    };
  }

  const maxOptionsResult = normalizeMaxOptions(config.maxOptions);

  if (!maxOptionsResult.success) {
    return {
      success: false,
      reason: maxOptionsResult.reason,
    };
  }

  const contactFlow = await prisma.maintenanceContactFlow.findUnique({
    where: {
      contact_flow_id: normalizedContactFlowId,
    },
    select: {
      contact_flow_id: true,
      follow_up: {
        select: {
          operational_zone_id: true,
        },
      },
      installation: {
        select: {
          operational_zone_id: true,
        },
      },
      client: {
        select: {
          operational_zone_id: true,
        },
      },
    },
  });

  if (!contactFlow) {
    return {
      success: false,
      reason: "No se encontró el flujo de contacto.",
    };
  }

  const operationalZoneId =
    contactFlow.follow_up.operational_zone_id ??
    contactFlow.installation?.operational_zone_id ??
    contactFlow.client.operational_zone_id ??
    null;

  if (!operationalZoneId) {
    return {
      success: false,
      reason:
        "No se pudo determinar la zona operativa del mantenimiento, la instalación o el cliente.",
    };
  }

  const suggestionsResult =
    await getOperationalZoneVisitDateSuggestions(operationalZoneId);

  if (!suggestionsResult.body.success) {
    return {
      success: false,
      reason:
        suggestionsResult.body.message ||
        "No se pudieron consultar las fechas disponibles para la zona.",
    };
  }

  const suggestions = suggestionsResult.body.data ?? [];

  if (suggestions.length === 0) {
    return {
      success: false,
      reason:
        suggestionsResult.body.message ||
        "No hay fechas disponibles para ofrecer actualmente en esta zona.",
    };
  }

  const options = buildDateOptions(suggestions, maxOptionsResult.maxOptions);

  if (options.length === 0) {
    return {
      success: false,
      reason: "No se encontraron fechas disponibles para ofrecer actualmente.",
    };
  }

  return {
    success: true,
    contactFlowId: normalizedContactFlowId,
    operationalZoneId,
    options,
    maxOptions: maxOptionsResult.maxOptions,
  };
}

/**
 * Construye el metadata estructurado que debe guardarse en el mensaje
 * OUTBOUND que presenta las opciones al cliente.
 */
export function buildContactFlowDateOptionsMetadata(params: {
  operationalZoneId: string;
  options: ContactFlowDateOption[];
  maxOptions?: number | null;
  generatedAt?: Date;
}): Prisma.InputJsonValue {
  const generatedAt = params.generatedAt ?? new Date();
  const maxOptionsResult = normalizeMaxOptions(params.maxOptions);

  if (!maxOptionsResult.success) {
    throw new Error(maxOptionsResult.reason);
  }

  const metadata: ContactFlowDateOptionsMetadata = {
    purpose: CONTACT_FLOW_DATE_OPTIONS_PURPOSE,
    source: "operational-zone-visit-dates",
    operational_zone_id: params.operationalZoneId,
    generated_at: generatedAt.toISOString(),
    option_count: params.options.length,
    option_limit: maxOptionsResult.maxOptions,
    option_map: params.options,
  };

  return metadata as Prisma.InputJsonValue;
}

/**
 * Busca el mensaje saliente más reciente que realmente contenía
 * opciones de fecha para el flujo.
 *
 * Se revisan varios mensajes porque el último mensaje saliente puede ser
 * otro tipo de respuesta automática.
 */
export async function findLatestContactFlowDateOptionsMessage(
  contactFlowId: string,
): Promise<LatestDateOptionsMessage | null> {
  const messages = await prisma.maintenanceContactMessage.findMany({
    where: {
      contact_flow_id: contactFlowId,
      direction: "OUTBOUND",
    },
    orderBy: {
      created_at: "desc",
    },
    take: 25,
    select: {
      message_id: true,
      metadata: true,
      created_at: true,
    },
  });

  for (const message of messages) {
    const metadata = parseContactFlowDateOptionsMetadata(message.metadata);

    if (metadata) {
      return {
        messageId: message.message_id,
        createdAt: message.created_at,
        metadata,
      };
    }
  }

  return null;
}

/**
 * Interpreta una respuesta numérica cuando el flujo se encuentra en
 * OPTIONS_SENT.
 *
 * La cantidad de opciones no está limitada en este servicio. La respuesta
 * se valida contra el option_map que fue realmente enviado al cliente.
 *
 * La fecha se vuelve a evaluar con el motor de disponibilidad antes de
 * devolverla.
 *
 * Esta función no actualiza selected_date ni scheduled_date.
 */
export async function resolveContactFlowDateSelection(params: {
  contactFlowId: string;
  messageText: string;
}): Promise<ResolveContactFlowDateSelectionResult> {
  const contactFlowId = params.contactFlowId.trim();
  const normalizedMessage = params.messageText.trim();

  if (!contactFlowId) {
    return {
      success: false,
      reason: "El identificador del flujo de contacto es requerido.",
    };
  }

  if (!/^\d+$/.test(normalizedMessage)) {
    return {
      success: false,
      reason:
        "La respuesta no corresponde a una opción de fecha válida. El cliente debe responder con el número de una de las fechas ofrecidas.",
    };
  }

  const selectedOptionNumber = Number(normalizedMessage);

  if (!Number.isSafeInteger(selectedOptionNumber) || selectedOptionNumber < 1) {
    return {
      success: false,
      reason: "La respuesta no corresponde a un número de opción válido.",
    };
  }

  const contactFlow = await prisma.maintenanceContactFlow.findUnique({
    where: {
      contact_flow_id: contactFlowId,
    },
    select: {
      status: true,
    },
  });

  if (!contactFlow) {
    return {
      success: false,
      reason: "No se encontró el flujo de contacto.",
    };
  }

  if (contactFlow.status !== "OPTIONS_SENT") {
    return {
      success: false,
      reason: "El flujo de contacto no está esperando una selección de fecha.",
    };
  }

  const latestOptionsMessage =
    await findLatestContactFlowDateOptionsMessage(contactFlowId);

  if (!latestOptionsMessage) {
    return {
      success: false,
      reason:
        "No se encontraron opciones de fecha previamente enviadas para este flujo.",
    };
  }

  const selectedOption = latestOptionsMessage.metadata.option_map.find(
    (option) => option.option === selectedOptionNumber,
  );

  if (!selectedOption) {
    return {
      success: false,
      reason:
        "La opción seleccionada no corresponde a ninguna fecha ofrecida al cliente.",
    };
  }

  const selectedDate = parseDateOnly(selectedOption.date);

  if (!selectedDate) {
    return {
      success: false,
      reason:
        "La fecha asociada con la opción seleccionada tiene un formato inválido.",
    };
  }

  const operationalZone = await findOperationalZoneById(
    selectedOption.operational_zone_id,
  );

  if (!operationalZone) {
    return {
      success: false,
      reason:
        "No se encontró la zona operativa asociada con la fecha seleccionada.",
    };
  }

  if (!operationalZone.is_active) {
    return {
      success: false,
      reason:
        "La zona operativa asociada con la fecha seleccionada está inactiva.",
    };
  }

  const availability = await evaluateAvailabilityForDate({
    country_code: operationalZone.country_code,
    date: selectedDate,
    operational_zone_id: operationalZone.operational_zone_id,
  });

  if (!availability.can_offer_day) {
    return {
      success: false,
      reason:
        availability.reason ||
        "La fecha seleccionada ya no se encuentra disponible.",
    };
  }

  return {
    success: true,
    selectedDate,
    selectedOption,
    availability,
  };
}

function buildDateOptions(
  suggestions: OperationalZoneVisitDateSuggestion[],
  maxOptions: number | null,
): ContactFlowDateOption[] {
  const sortedSuggestions = [...suggestions].sort((left, right) =>
    left.visit_date.localeCompare(right.visit_date),
  );

  const visibleSuggestions =
    maxOptions === null
      ? sortedSuggestions
      : sortedSuggestions.slice(0, maxOptions);

  return visibleSuggestions.map((suggestion, index) => ({
    option: index + 1,
    date: suggestion.visit_date,
    operational_zone_visit_date_id: suggestion.operational_zone_visit_date_id,
    operational_zone_id: suggestion.operational_zone_id,
    reason: suggestion.reason,
  }));
}

function parseContactFlowDateOptionsMetadata(
  value: Prisma.JsonValue | null,
): ContactFlowDateOptionsMetadata | null {
  if (!isJsonRecord(value)) {
    return null;
  }

  if (value.purpose !== CONTACT_FLOW_DATE_OPTIONS_PURPOSE) {
    return null;
  }

  if (value.source !== "operational-zone-visit-dates") {
    return null;
  }

  if (typeof value.operational_zone_id !== "string") {
    return null;
  }

  if (!Array.isArray(value.option_map)) {
    return null;
  }

  const optionMap: ContactFlowDateOption[] = [];
  const usedOptionNumbers = new Set<number>();

  for (const rawOption of value.option_map) {
    if (!isJsonRecord(rawOption)) {
      return null;
    }

    if (
      typeof rawOption.option !== "number" ||
      !Number.isSafeInteger(rawOption.option) ||
      rawOption.option < 1 ||
      usedOptionNumbers.has(rawOption.option) ||
      typeof rawOption.date !== "string" ||
      typeof rawOption.operational_zone_visit_date_id !== "string" ||
      typeof rawOption.operational_zone_id !== "string" ||
      typeof rawOption.reason !== "string"
    ) {
      return null;
    }

    usedOptionNumbers.add(rawOption.option);

    optionMap.push({
      option: rawOption.option,
      date: rawOption.date,
      operational_zone_visit_date_id: rawOption.operational_zone_visit_date_id,
      operational_zone_id: rawOption.operational_zone_id,
      reason: rawOption.reason,
    });
  }

  if (optionMap.length === 0) {
    return null;
  }

  const parsedOptionLimit =
    value.option_limit === null || value.option_limit === undefined
      ? null
      : typeof value.option_limit === "number" &&
          Number.isSafeInteger(value.option_limit) &&
          value.option_limit > 0
        ? value.option_limit
        : null;

  return {
    purpose: CONTACT_FLOW_DATE_OPTIONS_PURPOSE,
    source: "operational-zone-visit-dates",
    operational_zone_id: value.operational_zone_id,
    generated_at:
      typeof value.generated_at === "string" ? value.generated_at : "",
    option_count:
      typeof value.option_count === "number" &&
      Number.isSafeInteger(value.option_count) &&
      value.option_count >= 0
        ? value.option_count
        : optionMap.length,
    option_limit: parsedOptionLimit,
    option_map: optionMap,
  };
}

function normalizeMaxOptions(value: number | null | undefined):
  | {
      success: true;
      maxOptions: number | null;
    }
  | {
      success: false;
      reason: string;
    } {
  if (value === null || value === undefined) {
    return {
      success: true,
      maxOptions: null,
    };
  }

  if (!Number.isSafeInteger(value) || value < 1) {
    return {
      success: false,
      reason:
        "La cantidad máxima de opciones debe ser un número entero positivo.",
    };
  }

  return {
    success: true,
    maxOptions: value,
  };
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

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

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
