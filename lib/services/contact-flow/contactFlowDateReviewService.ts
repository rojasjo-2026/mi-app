import { Prisma } from "@prisma/client";

import {
  evaluateAvailabilityForDate,
  type AvailabilityDateEvaluationResult,
} from "@/lib/availability/availability.service";
import {
  getOperationalZoneVisitDateSuggestions,
  type OperationalZoneVisitDateSuggestion,
} from "@/lib/operational-zones/operationalZoneVisitDateSuggestions.service";
import { findOperationalZoneById } from "@/lib/operational-zones/operationalZones.repository";
import { prisma } from "@/lib/prisma";
import { buildAutomaticReplyMessage } from "@/lib/services/contact-flow/contactFlowMessageTemplatesService";
import {
  recordContactMessageSentActivitySafely,
  recordContactStatusChangedActivitySafely,
} from "@/lib/services/whatsapp/whatsappActivityLogService";
import { sendWhatsAppTextMessage } from "@/lib/services/whatsappService";

export type ContactFlowDateReviewAction = "approve" | "change" | "reject";

type ContactFlowDateReviewServiceResult<T> = {
  status: number;
  body: {
    success: boolean;
    data?: T;
    message?: string;
    warning?: string;
  };
};

type ReviewContactFlowDateInput = {
  contactFlowId: string;
  action: ContactFlowDateReviewAction;
  selectedDate?: unknown;
  reason?: unknown;
  reviewedBy?: unknown;
};

type ReviewData = {
  contact_flow_id: string;
  follow_up_id: string;
  status: string;
  selected_date: string | null;
  scheduled_date: string | null;
  requires_manual_action: boolean;
  availability: AvailabilityDateEvaluationResult | null;
  whatsapp_message_sent: boolean;
};

type ReviewContextData = {
  contact_flow_id: string;
  follow_up_id: string;
  status: string;
  selected_date: string | null;
  scheduled_date: string | null;
  requires_manual_action: boolean;
  manual_reason: string | null;
  operational_zone_id: string | null;
  selected_date_availability: {
    checked: boolean;
    can_offer_day: boolean;
    reason: string;
  } | null;
  available_dates: OperationalZoneVisitDateSuggestion[];
};

export async function getContactFlowDateReview(
  contactFlowId: string,
): Promise<ContactFlowDateReviewServiceResult<ReviewContextData>> {
  const normalizedContactFlowId = contactFlowId.trim();

  if (!normalizedContactFlowId) {
    return errorResult(
      400,
      "El identificador del flujo de contacto es requerido.",
    );
  }

  const contactFlow = await findReviewContactFlow(normalizedContactFlowId);

  if (!contactFlow) {
    return errorResult(404, "No se encontró el flujo de contacto.");
  }

  const operationalZoneId = resolveOperationalZoneId(contactFlow);
  let availableDates: OperationalZoneVisitDateSuggestion[] = [];
  let selectedDateAvailability: ReviewContextData["selected_date_availability"] =
    null;

  if (operationalZoneId) {
    const suggestionsResult =
      await getOperationalZoneVisitDateSuggestions(operationalZoneId);

    if (suggestionsResult.body.success) {
      availableDates = suggestionsResult.body.data ?? [];
    }

    if (contactFlow.selected_date) {
      const availabilityResult = await evaluateDateForOperationalZone({
        operationalZoneId,
        date: contactFlow.selected_date,
      });

      selectedDateAvailability = availabilityResult.success
        ? {
            checked: true,
            can_offer_day: availabilityResult.availability.can_offer_day,
            reason:
              availabilityResult.availability.reason ||
              "La disponibilidad fue evaluada con las reglas actuales.",
          }
        : {
            checked: false,
            can_offer_day: false,
            reason: availabilityResult.reason,
          };
    }
  } else if (contactFlow.selected_date) {
    selectedDateAvailability = {
      checked: false,
      can_offer_day: false,
      reason:
        "No se pudo determinar la zona operativa para evaluar la fecha seleccionada.",
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      data: {
        contact_flow_id: contactFlow.contact_flow_id,
        follow_up_id: contactFlow.follow_up_id,
        status: contactFlow.status,
        selected_date: formatDateOnlyNullable(contactFlow.selected_date),
        scheduled_date: formatDateOnlyNullable(
          contactFlow.follow_up.scheduled_date,
        ),
        requires_manual_action: contactFlow.requires_manual_action,
        manual_reason: contactFlow.manual_reason,
        operational_zone_id: operationalZoneId,
        selected_date_availability: selectedDateAvailability,
        available_dates: availableDates,
      },
    },
  };
}

export async function reviewContactFlowDate(
  input: ReviewContactFlowDateInput,
): Promise<ContactFlowDateReviewServiceResult<ReviewData>> {
  const contactFlowId = input.contactFlowId.trim();
  const reviewedBy = normalizeOptionalText(input.reviewedBy);
  const reason = normalizeOptionalText(input.reason);

  if (!contactFlowId) {
    return errorResult(
      400,
      "El identificador del flujo de contacto es requerido.",
    );
  }

  if (!isReviewAction(input.action)) {
    return errorResult(400, "La acción de revisión no es válida.");
  }

  const contactFlow = await findReviewContactFlow(contactFlowId);

  if (!contactFlow) {
    return errorResult(404, "No se encontró el flujo de contacto.");
  }

  if (contactFlow.status !== "MANUAL_REQUIRED") {
    return errorResult(
      409,
      "El flujo no se encuentra pendiente de revisión humana.",
    );
  }

  if (input.action === "change") {
    return changeSelectedDate({
      contactFlow,
      selectedDateValue: input.selectedDate,
      reason,
      reviewedBy,
    });
  }

  if (input.action === "reject") {
    return rejectSelectedDate({
      contactFlow,
      reason,
      reviewedBy,
    });
  }

  return approveSelectedDate({
    contactFlow,
    reviewedBy,
  });
}

async function changeSelectedDate(params: {
  contactFlow: ReviewContactFlow;
  selectedDateValue: unknown;
  reason: string | null;
  reviewedBy: string | null;
}): Promise<ContactFlowDateReviewServiceResult<ReviewData>> {
  const selectedDate = parseDateOnly(params.selectedDateValue);

  if (!selectedDate) {
    return errorResult(
      400,
      "Debe seleccionar una fecha válida con formato YYYY-MM-DD.",
    );
  }

  const operationalZoneId = resolveOperationalZoneId(params.contactFlow);

  if (!operationalZoneId) {
    return errorResult(
      409,
      "No se pudo determinar la zona operativa del mantenimiento.",
    );
  }

  const configuredAndAvailable = await validateConfiguredAvailableDate({
    operationalZoneId,
    selectedDate,
  });

  if (!configuredAndAvailable.success) {
    return errorResult(409, configuredAndAvailable.reason);
  }

  const dateLabel = formatDateOnly(selectedDate);
  const now = new Date();
  const manualReason =
    params.reason ||
    `El usuario cambió la fecha pendiente a ${dateLabel}. La nueva fecha continúa pendiente de confirmación humana.`;

  const updatedFlow = await prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: params.contactFlow.contact_flow_id,
    },
    data: {
      selected_date: selectedDate,
      status: "MANUAL_REQUIRED",
      requires_manual_action: true,
      manual_reason: manualReason,
      closed_at: null,
      last_message_at: now,
    },
  });

  return {
    status: 200,
    body: {
      success: true,
      data: {
        contact_flow_id: updatedFlow.contact_flow_id,
        follow_up_id: params.contactFlow.follow_up_id,
        status: updatedFlow.status,
        selected_date: formatDateOnlyNullable(updatedFlow.selected_date),
        scheduled_date: formatDateOnlyNullable(
          params.contactFlow.follow_up.scheduled_date,
        ),
        requires_manual_action: updatedFlow.requires_manual_action,
        availability: configuredAndAvailable.availability,
        whatsapp_message_sent: false,
      },
      message:
        "La fecha pendiente fue cambiada. Aún debe confirmarse manualmente.",
    },
  };
}

async function rejectSelectedDate(params: {
  contactFlow: ReviewContactFlow;
  reason: string | null;
  reviewedBy: string | null;
}): Promise<ContactFlowDateReviewServiceResult<ReviewData>> {
  if (!params.contactFlow.selected_date) {
    return errorResult(
      409,
      "El flujo no tiene una fecha seleccionada pendiente de rechazo.",
    );
  }

  const previousSelectedDate = formatDateOnly(params.contactFlow.selected_date);
  const now = new Date();
  const manualReason =
    params.reason ||
    `El usuario rechazó la fecha seleccionada ${previousSelectedDate}. Se requiere coordinar una nueva fecha.`;

  const updatedFlow = await prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: params.contactFlow.contact_flow_id,
    },
    data: {
      selected_date: null,
      status: "MANUAL_REQUIRED",
      requires_manual_action: true,
      manual_reason: manualReason,
      closed_at: null,
      last_message_at: now,
    },
  });

  const outboundMessage = buildAutomaticReplyMessage({
    automationResult: {
      status: "MANUAL_REQUIRED",
      manualReason: "El mantenimiento debe reprogramarse.",
    },
    clientName: params.contactFlow.client.first_name,
    installationName: params.contactFlow.installation?.description || null,
    countryCode: params.contactFlow.client.country_code,
  });

  const messageResult = await sendAndPersistReviewMessage({
    contactFlow: params.contactFlow,
    message: outboundMessage,
    purpose: "OPERATIONAL_ZONE_DATE_SELECTION_REJECTED",
    reviewedBy: params.reviewedBy,
    metadata: {
      rejected_selected_date: previousSelectedDate,
      reason: manualReason,
      requires_new_coordination: true,
    },
  });

  return {
    status: 200,
    body: {
      success: true,
      data: {
        contact_flow_id: updatedFlow.contact_flow_id,
        follow_up_id: params.contactFlow.follow_up_id,
        status: updatedFlow.status,
        selected_date: null,
        scheduled_date: formatDateOnlyNullable(
          params.contactFlow.follow_up.scheduled_date,
        ),
        requires_manual_action: updatedFlow.requires_manual_action,
        availability: null,
        whatsapp_message_sent: messageResult.success,
      },
      message:
        "La fecha seleccionada fue rechazada y el flujo permanece pendiente de coordinación.",
      warning: messageResult.success
        ? undefined
        : "La decisión se guardó, pero no se pudo enviar el mensaje de WhatsApp.",
    },
  };
}

async function approveSelectedDate(params: {
  contactFlow: ReviewContactFlow;
  reviewedBy: string | null;
}): Promise<ContactFlowDateReviewServiceResult<ReviewData>> {
  const selectedDate = params.contactFlow.selected_date;

  if (!selectedDate) {
    return errorResult(
      409,
      "El flujo no tiene una fecha seleccionada pendiente de aprobación.",
    );
  }

  const operationalZoneId = resolveOperationalZoneId(params.contactFlow);

  if (!operationalZoneId) {
    return errorResult(
      409,
      "No se pudo determinar la zona operativa del mantenimiento.",
    );
  }

  /*
   * Tercera validación:
   * 1. antes de ofrecer la fecha;
   * 2. cuando el cliente la selecciona;
   * 3. ahora, cuando el usuario humano la aprueba.
   */
  const availabilityResult = await evaluateDateForOperationalZone({
    operationalZoneId,
    date: selectedDate,
  });

  if (!availabilityResult.success) {
    await keepFlowPendingAfterFailedApproval({
      contactFlowId: params.contactFlow.contact_flow_id,
      selectedDate,
      reason: availabilityResult.reason,
    });

    return errorResult(409, availabilityResult.reason);
  }

  if (!availabilityResult.availability.can_offer_day) {
    const reason =
      availabilityResult.availability.reason ||
      "La fecha seleccionada ya no se encuentra disponible.";

    await keepFlowPendingAfterFailedApproval({
      contactFlowId: params.contactFlow.contact_flow_id,
      selectedDate,
      reason,
    });

    return errorResult(409, reason);
  }

  const confirmedStatusId = await findFollowUpStatusId([
    "confirmed",
    "scheduled",
  ]);

  const approvedAt = new Date();
  const dateLabel = formatDateOnly(selectedDate);
  const auditLine = `[WhatsApp ${approvedAt.toISOString()}] Fecha ${dateLabel} aprobada manualmente${
    params.reviewedBy ? ` por ${params.reviewedBy}` : ""
  }.`;

  const existingNotes = params.contactFlow.follow_up.notes?.trim();
  const notes = [existingNotes, auditLine].filter(Boolean).join("\n");

  const [updatedFollowUp, updatedFlow] = await prisma.$transaction([
    prisma.followUp.update({
      where: {
        follow_up_id: params.contactFlow.follow_up_id,
      },
      data: {
        scheduled_date: selectedDate,
        notes,
        follow_up_status_id: confirmedStatusId ?? undefined,
      },
    }),
    prisma.maintenanceContactFlow.update({
      where: {
        contact_flow_id: params.contactFlow.contact_flow_id,
      },
      data: {
        status: "CONFIRMED",
        requires_manual_action: false,
        manual_reason: null,
        closed_at: approvedAt,
        last_message_at: approvedAt,
      },
    }),
  ]);

  await recordContactStatusChangedActivitySafely({
    clientId: params.contactFlow.client_id,
    contactFlowId: params.contactFlow.contact_flow_id,
    followUpId: params.contactFlow.follow_up_id,
    installationId: params.contactFlow.installation_id,
    phoneNumber:
      params.contactFlow.contact_phone ||
      params.contactFlow.client.phone_primary,
    oldStatus: params.contactFlow.status,
    newStatus: "CONFIRMED",
    manualReason: null,
    createdBy: params.reviewedBy,
  });

  const confirmationMessage = buildAutomaticReplyMessage({
    automationResult: {
      status: "CONFIRMED",
      manualReason: null,
    },
    clientName: params.contactFlow.client.first_name,
    installationName: params.contactFlow.installation?.description || null,
    scheduledDate: dateLabel,
    countryCode: params.contactFlow.client.country_code,
  });

  const messageResult = await sendAndPersistReviewMessage({
    contactFlow: params.contactFlow,
    message: confirmationMessage,
    purpose: "OPERATIONAL_ZONE_DATE_APPROVED",
    reviewedBy: params.reviewedBy,
    metadata: {
      selected_date: dateLabel,
      scheduled_date: dateLabel,
      approved_at: approvedAt.toISOString(),
      approved_by: params.reviewedBy,
      availability_checked: true,
      availability_can_offer_day: availabilityResult.availability.can_offer_day,
      availability_reason: availabilityResult.availability.reason ?? null,
    },
  });

  return {
    status: 200,
    body: {
      success: true,
      data: {
        contact_flow_id: updatedFlow.contact_flow_id,
        follow_up_id: updatedFollowUp.follow_up_id,
        status: updatedFlow.status,
        selected_date: formatDateOnlyNullable(updatedFlow.selected_date),
        scheduled_date: formatDateOnlyNullable(updatedFollowUp.scheduled_date),
        requires_manual_action: updatedFlow.requires_manual_action,
        availability: availabilityResult.availability,
        whatsapp_message_sent: messageResult.success,
      },
      message: "La fecha fue confirmada correctamente.",
      warning: messageResult.success
        ? undefined
        : "La fecha quedó confirmada, pero no se pudo enviar el mensaje de WhatsApp.",
    },
  };
}

async function keepFlowPendingAfterFailedApproval(params: {
  contactFlowId: string;
  selectedDate: Date;
  reason: string;
}) {
  const dateLabel = formatDateOnly(params.selectedDate);

  await prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: params.contactFlowId,
    },
    data: {
      status: "MANUAL_REQUIRED",
      requires_manual_action: true,
      manual_reason: `La fecha ${dateLabel} no pudo aprobarse. Motivo: ${params.reason}`,
      closed_at: null,
    },
  });
}

async function validateConfiguredAvailableDate(params: {
  operationalZoneId: string;
  selectedDate: Date;
}): Promise<
  | {
      success: true;
      availability: AvailabilityDateEvaluationResult;
    }
  | {
      success: false;
      reason: string;
    }
> {
  const selectedDateLabel = formatDateOnly(params.selectedDate);
  const suggestionsResult = await getOperationalZoneVisitDateSuggestions(
    params.operationalZoneId,
  );

  if (!suggestionsResult.body.success) {
    return {
      success: false,
      reason:
        suggestionsResult.body.message ||
        "No se pudieron consultar las fechas disponibles para la zona.",
    };
  }

  const matchingSuggestion = (suggestionsResult.body.data ?? []).find(
    (suggestion) => suggestion.visit_date === selectedDateLabel,
  );

  if (!matchingSuggestion) {
    return {
      success: false,
      reason:
        "La fecha seleccionada no está configurada o no se encuentra disponible actualmente para esta zona.",
    };
  }

  const availabilityResult = await evaluateDateForOperationalZone({
    operationalZoneId: params.operationalZoneId,
    date: params.selectedDate,
  });

  if (!availabilityResult.success) {
    return availabilityResult;
  }

  if (!availabilityResult.availability.can_offer_day) {
    return {
      success: false,
      reason:
        availabilityResult.availability.reason ||
        "La fecha seleccionada ya no se encuentra disponible.",
    };
  }

  return {
    success: true,
    availability: availabilityResult.availability,
  };
}

async function evaluateDateForOperationalZone(params: {
  operationalZoneId: string;
  date: Date;
}): Promise<
  | {
      success: true;
      availability: AvailabilityDateEvaluationResult;
    }
  | {
      success: false;
      reason: string;
    }
> {
  const operationalZone = await findOperationalZoneById(
    params.operationalZoneId,
  );

  if (!operationalZone) {
    return {
      success: false,
      reason: "No se encontró la zona operativa.",
    };
  }

  if (!operationalZone.is_active) {
    return {
      success: false,
      reason: "La zona operativa se encuentra inactiva.",
    };
  }

  const availability = await evaluateAvailabilityForDate({
    country_code: operationalZone.country_code,
    date: formatDateOnly(params.date),
    operational_zone_id: operationalZone.operational_zone_id,
  });

  return {
    success: true,
    availability,
  };
}

async function sendAndPersistReviewMessage(params: {
  contactFlow: ReviewContactFlow;
  message: string;
  purpose: string;
  reviewedBy: string | null;
  metadata: Prisma.InputJsonObject;
}) {
  const phoneNumber =
    params.contactFlow.contact_phone || params.contactFlow.client.phone_primary;

  if (!phoneNumber) {
    return {
      success: false,
      reason: "El cliente no tiene un número de teléfono disponible.",
    };
  }

  const sendResult = await sendWhatsAppTextMessage({
    to: phoneNumber,
    message: params.message,
  });

  const sentAt = new Date();
  const waMessageId =
    sendResult.success && sendResult.wa_message_id
      ? sendResult.wa_message_id
      : `review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const savedMessage = await prisma.maintenanceContactMessage.create({
    data: {
      contact_flow_id: params.contactFlow.contact_flow_id,
      direction: "OUTBOUND",
      message_text: params.message,
      wa_message_id: waMessageId,
      phone_number: phoneNumber,
      message_type: "text",
      delivery_status: sendResult.success
        ? sendResult.isMock
          ? "mock-sent"
          : "sent"
        : "failed",
      metadata: {
        purpose: params.purpose,
        reviewed_by: params.reviewedBy,
        ...params.metadata,
        provider: "meta-whatsapp",
        isMock: sendResult.isMock,
        raw: sendResult.success ? (sendResult.raw ?? null) : null,
        error: sendResult.success
          ? null
          : sendResult.error instanceof Error
            ? sendResult.error.message
            : "WhatsApp message failed.",
      } as Prisma.InputJsonValue,
      sent_at: sentAt,
    },
  });

  await prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: params.contactFlow.contact_flow_id,
    },
    data: {
      last_message_at: sentAt,
      contact_phone: phoneNumber,
    },
  });

  await recordContactMessageSentActivitySafely({
    clientId: params.contactFlow.client_id,
    contactFlowId: params.contactFlow.contact_flow_id,
    messageId: savedMessage.message_id,
    followUpId: params.contactFlow.follow_up_id,
    installationId: params.contactFlow.installation_id,
    phoneNumber,
    waMessageId,
    deliveryStatus: savedMessage.delivery_status,
    isMock: sendResult.isMock,
    messageText: params.message,
    createdBy: params.reviewedBy,
  });

  if (!sendResult.success) {
    console.error("Review WhatsApp message failed:", sendResult.error);
  }

  return {
    success: sendResult.success,
    reason: sendResult.success
      ? null
      : "No se pudo enviar el mensaje de WhatsApp.",
  };
}

async function findFollowUpStatusId(candidates: string[]) {
  const normalizedCandidates = candidates.map((value) => value.toLowerCase());

  const statuses = await prisma.followUpStatus.findMany({
    where: {
      is_active: true,
    },
    select: {
      follow_up_status_id: true,
      code: true,
    },
  });

  const match = statuses.find((status) =>
    normalizedCandidates.includes(status.code.toLowerCase()),
  );

  return match?.follow_up_status_id ?? null;
}

function resolveOperationalZoneId(contactFlow: ReviewContactFlow) {
  return (
    contactFlow.follow_up.operational_zone_id ??
    contactFlow.installation?.operational_zone_id ??
    contactFlow.client.operational_zone_id ??
    null
  );
}

function parseDateOnly(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDateOnlyNullable(value?: Date | null) {
  return value ? formatDateOnly(value) : null;
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isReviewAction(value: unknown): value is ContactFlowDateReviewAction {
  return value === "approve" || value === "change" || value === "reject";
}

function errorResult(
  status: number,
  message: string,
): ContactFlowDateReviewServiceResult<never> {
  return {
    status,
    body: {
      success: false,
      message,
    },
  };
}

async function findReviewContactFlow(contactFlowId: string) {
  return prisma.maintenanceContactFlow.findUnique({
    where: {
      contact_flow_id: contactFlowId,
    },
    include: {
      client: true,
      installation: true,
      follow_up: {
        include: {
          follow_up_status: true,
        },
      },
    },
  });
}

type ReviewContactFlow = NonNullable<
  Awaited<ReturnType<typeof findReviewContactFlow>>
>;
