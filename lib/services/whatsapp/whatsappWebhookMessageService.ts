import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildAutomaticReply,
  resolveInboundFlowUpdate,
  type AutomationResult,
} from "@/lib/services/contactFlowAutomationService";
import {
  evaluateContactFlowAvailability,
  mergeAutomationWithAvailability,
} from "@/lib/services/contact-flow/contactFlowAvailabilityService";
import {
  buildContactFlowDateOptionsMetadata,
  findLatestContactFlowDateOptionsMessage,
  getContactFlowDateOptions,
  resolveContactFlowDateSelection,
} from "@/lib/services/contact-flow/contactFlowDateOptionsService";
import {
  buildContactFlowDateOptionsMessageTemplate,
  buildContactFlowDatePreferenceReceivedMessageTemplate,
  buildContactFlowNoAvailableDatesMessageTemplate,
  buildContactFlowSelectedDateUnavailableMessageTemplate,
} from "@/lib/services/contact-flow/contactFlowMessageTemplatesService";
import {
  recordContactMessageReceivedActivitySafely,
  recordContactStatusChangedActivitySafely,
} from "@/lib/services/whatsapp/whatsappActivityLogService";
import { syncFollowUpWithAutomation } from "@/lib/services/whatsapp/followUpWhatsappSyncService";
import {
  buildPhoneCandidates,
  normalizePhoneNumber,
  parseUnixTimestamp,
  sanitizePhoneNumber,
} from "@/lib/services/whatsapp/whatsappPhoneService";
import type { WhatsAppWebhookTextMessage } from "@/lib/services/whatsapp/whatsappWebhookTypes";
import { sendWhatsAppTextMessage } from "@/lib/services/whatsappService";

const ACTIVE_FLOW_STATUSES = [
  "PENDING",
  "NO_RESPONSE",
  "MESSAGE_SENT",
  "WAITING_RESPONSE",
  "OPTIONS_SENT",
  "DATE_SELECTED",
  "MANUAL_REQUIRED",
] as const;

type EligibleContactFlow = NonNullable<
  Awaited<ReturnType<typeof findEligibleContactFlow>>
>;

type PersistOutboundMessageResult = {
  success: boolean;
  sentAt: Date;
};

export async function handleIncomingMessage(
  message: WhatsAppWebhookTextMessage,
) {
  const rawFrom = sanitizePhoneNumber(message.from);
  const normalizedFrom = normalizePhoneNumber(message.from);
  const phoneCandidates = buildPhoneCandidates(rawFrom, normalizedFrom);

  const messageText = message.text?.body?.trim() || "";
  const waMessageId = message.id || null;
  const receivedAt = parseUnixTimestamp(message.timestamp);

  if (!messageText || phoneCandidates.length === 0) {
    console.warn("Webhook skipped: missing text or phone candidate.", {
      messageText,
      phoneCandidates,
    });
    return;
  }

  const contactFlow = await findEligibleContactFlow(phoneCandidates);

  if (!contactFlow) {
    console.warn(
      "No eligible maintenance contact flow found for incoming WhatsApp number candidates:",
      phoneCandidates,
    );
    return;
  }

  const persistedPhone = normalizedFrom ?? rawFrom ?? null;

  const savedInboundMessage = await prisma.maintenanceContactMessage.create({
    data: {
      contact_flow_id: contactFlow.contact_flow_id,
      direction: "INBOUND",
      message_text: messageText,
      wa_message_id: waMessageId ?? undefined,
      phone_number: persistedPhone ?? undefined,
      message_type: message.type || "text",
      delivery_status: "received",
      metadata: {
        from: message.from ?? null,
        normalizedFrom: persistedPhone,
        timestamp: message.timestamp ?? null,
        type: message.type ?? "text",
      } as Prisma.InputJsonValue,
      received_at: receivedAt,
    },
  });

  await recordContactMessageReceivedActivitySafely({
    clientId: contactFlow.client_id,
    contactFlowId: contactFlow.contact_flow_id,
    messageId: savedInboundMessage.message_id,
    followUpId: contactFlow.follow_up_id,
    installationId: contactFlow.installation_id,
    phoneNumber: persistedPhone,
    waMessageId,
    deliveryStatus: savedInboundMessage.delivery_status,
    messageText,
  });

  /*
   * Cuando ya se enviaron opciones, una respuesta numérica pertenece al
   * mapa de fechas ofrecidas y no al menú general de WhatsApp.
   */
  if (contactFlow.status === "OPTIONS_SENT") {
    await handleDateSelectionResponse({
      contactFlow,
      messageText,
      receivedAt,
      persistedPhone,
      inboundMessageId: savedInboundMessage.message_id,
    });
    return;
  }

  const baseAutomationResult = resolveInboundFlowUpdate(messageText);

  /*
   * Las respuestas que confirman disponibilidad o solicitan otra fecha
   * abren el flujo de sugerencias. Las fechas vienen configuradas por zona
   * y ya fueron filtradas por el motor real de disponibilidad.
   */
  if (shouldOfferDateOptions(baseAutomationResult)) {
    await handleDateOptionsRequest({
      contactFlow,
      baseAutomationResult,
      messageText,
      receivedAt,
      persistedPhone,
      inboundMessageId: savedInboundMessage.message_id,
    });
    return;
  }

  await handleRegularAutomationResponse({
    contactFlow,
    baseAutomationResult,
    messageText,
    receivedAt,
    persistedPhone,
    inboundMessageId: savedInboundMessage.message_id,
  });
}

async function handleDateOptionsRequest(params: {
  contactFlow: EligibleContactFlow;
  baseAutomationResult: AutomationResult;
  messageText: string;
  receivedAt: Date;
  persistedPhone: string | null;
  inboundMessageId: string;
}) {
  const {
    contactFlow,
    baseAutomationResult,
    messageText,
    receivedAt,
    persistedPhone,
    inboundMessageId,
  } = params;

  /*
   * Sin maxOptions se devuelven todas las fechas disponibles.
   * Más adelante el llamador puede enviar un límite resuelto desde
   * Configuración sin cambiar este flujo.
   */
  const dateOptionsResult = await getContactFlowDateOptions(
    contactFlow.contact_flow_id,
  );

  if (!dateOptionsResult.success) {
    const automationResult: AutomationResult = {
      status: "MANUAL_REQUIRED",
      requiresManualAction: true,
      manualReason: `${baseAutomationResult.manualReason || "El cliente solicitó coordinar una fecha."} ${dateOptionsResult.reason}`,
      selectedDate: null,
      shouldClose: false,
    };

    await updateContactFlowFromAutomation({
      contactFlow,
      automationResult,
      messageText,
      receivedAt,
      persistedPhone,
      inboundMessageId,
    });

    await syncFollowUpSafely({
      contactFlow,
      automationResult,
      receivedAt,
      inboundText: messageText,
    });

    const reply = buildContactFlowNoAvailableDatesMessageTemplate({
      clientName: contactFlow.client.first_name,
      installationName: contactFlow.installation?.description || null,
    });

    await sendAndPersistOutboundMessage({
      contactFlow,
      to: persistedPhone ?? contactFlow.client.phone_primary,
      message: reply,
      metadata: {
        purpose: "OPERATIONAL_ZONE_DATE_OPTIONS_UNAVAILABLE",
        reason: dateOptionsResult.reason,
      },
    });

    return;
  }

  const reply = buildContactFlowDateOptionsMessageTemplate({
    clientName: contactFlow.client.first_name,
    installationName: contactFlow.installation?.description || null,
    countryCode: contactFlow.client.country_code,
    options: dateOptionsResult.options.map((option) => ({
      option: option.option,
      date: option.date,
    })),
  });

  const optionsMetadata = buildContactFlowDateOptionsMetadata({
    operationalZoneId: dateOptionsResult.operationalZoneId,
    options: dateOptionsResult.options,
    maxOptions: dateOptionsResult.maxOptions,
  }) as Prisma.InputJsonObject;

  const outboundResult = await sendAndPersistOutboundMessage({
    contactFlow,
    to: persistedPhone ?? contactFlow.client.phone_primary,
    message: reply,
    metadata: optionsMetadata,
  });

  if (outboundResult.success) {
    await prisma.maintenanceContactFlow.update({
      where: {
        contact_flow_id: contactFlow.contact_flow_id,
      },
      data: {
        status: "OPTIONS_SENT",
        requires_manual_action: false,
        manual_reason: null,
        selected_date: null,
        last_inbound_message: messageText,
        last_message_at: outboundResult.sentAt,
        contact_phone: persistedPhone ?? undefined,
        closed_at: null,
      },
    });

    await recordStatusChangeIfNeeded({
      contactFlow,
      newStatus: "OPTIONS_SENT",
      persistedPhone,
      inboundMessageId,
      inboundMessageText: messageText,
      manualReason: null,
    });

    return;
  }

  const automationResult: AutomationResult = {
    status: "MANUAL_REQUIRED",
    requiresManualAction: true,
    manualReason:
      "No se pudieron enviar al cliente las fechas disponibles por WhatsApp. Se requiere seguimiento manual.",
    selectedDate: null,
    shouldClose: false,
  };

  await updateContactFlowFromAutomation({
    contactFlow,
    automationResult,
    messageText,
    receivedAt,
    persistedPhone,
    inboundMessageId,
  });

  await syncFollowUpSafely({
    contactFlow,
    automationResult,
    receivedAt,
    inboundText: messageText,
  });
}

async function handleDateSelectionResponse(params: {
  contactFlow: EligibleContactFlow;
  messageText: string;
  receivedAt: Date;
  persistedPhone: string | null;
  inboundMessageId: string;
}) {
  const {
    contactFlow,
    messageText,
    receivedAt,
    persistedPhone,
    inboundMessageId,
  } = params;

  const normalizedMessage = messageText.trim();
  const latestOptionsMessage = await findLatestContactFlowDateOptionsMessage(
    contactFlow.contact_flow_id,
  );

  const selectedOptionNumber = /^\d+$/.test(normalizedMessage)
    ? Number(normalizedMessage)
    : null;

  const offeredOption =
    selectedOptionNumber !== null &&
    Number.isSafeInteger(selectedOptionNumber) &&
    selectedOptionNumber > 0
      ? (latestOptionsMessage?.metadata.option_map.find(
          (option) => option.option === selectedOptionNumber,
        ) ?? null)
      : null;

  /*
   * Una respuesta inválida no debe sacar al flujo de OPTIONS_SENT.
   * El cliente conserva la oportunidad de responder con uno de los números
   * que realmente fueron enviados.
   */
  if (!latestOptionsMessage || !offeredOption) {
    await prisma.maintenanceContactFlow.update({
      where: {
        contact_flow_id: contactFlow.contact_flow_id,
      },
      data: {
        last_inbound_message: messageText,
        last_message_at: receivedAt,
        contact_phone: persistedPhone ?? undefined,
      },
    });

    const availableOptionNumbers =
      latestOptionsMessage?.metadata.option_map
        .map((option) => option.option)
        .sort((left, right) => left - right)
        .join(", ") || "";

    const reply = availableOptionNumbers
      ? `Hola ${contactFlow.client.first_name || "cliente"}, no pudimos identificar la fecha seleccionada. Por favor responda únicamente con uno de estos números: ${availableOptionNumbers}.`
      : `Hola ${contactFlow.client.first_name || "cliente"}, no pudimos identificar una opción de fecha válida. Nuestro equipo revisará el caso y continuará con la coordinación.`;

    await sendAndPersistOutboundMessage({
      contactFlow,
      to: persistedPhone ?? contactFlow.client.phone_primary,
      message: reply,
      metadata: {
        purpose: "OPERATIONAL_ZONE_DATE_OPTION_RETRY",
        received_value: messageText,
        available_option_numbers:
          latestOptionsMessage?.metadata.option_map.map(
            (option) => option.option,
          ) ?? [],
        source_options_message_id: latestOptionsMessage?.messageId ?? null,
      },
    });

    return;
  }

  const selectionResult = await resolveContactFlowDateSelection({
    contactFlowId: contactFlow.contact_flow_id,
    messageText,
  });

  if (!selectionResult.success) {
    const automationResult: AutomationResult = {
      status: "MANUAL_REQUIRED",
      requiresManualAction: true,
      manualReason: `El cliente seleccionó la opción ${offeredOption.option} para la fecha ${offeredOption.date}, pero no puede confirmarse. Motivo: ${selectionResult.reason}`,
      selectedDate: null,
      shouldClose: false,
    };

    await updateContactFlowFromAutomation({
      contactFlow,
      automationResult,
      messageText,
      receivedAt,
      persistedPhone,
      inboundMessageId,
    });

    await syncFollowUpSafely({
      contactFlow,
      automationResult,
      receivedAt,
      inboundText: messageText,
    });

    const reply = buildContactFlowSelectedDateUnavailableMessageTemplate({
      clientName: contactFlow.client.first_name,
      installationName: contactFlow.installation?.description || null,
      countryCode: contactFlow.client.country_code,
      selectedDate: offeredOption.date,
    });

    await sendAndPersistOutboundMessage({
      contactFlow,
      to: persistedPhone ?? contactFlow.client.phone_primary,
      message: reply,
      metadata: {
        purpose: "OPERATIONAL_ZONE_DATE_SELECTION_UNAVAILABLE",
        selected_option: offeredOption.option,
        selected_date: offeredOption.date,
        source_options_message_id: latestOptionsMessage.messageId,
        reason: selectionResult.reason,
      },
    });

    return;
  }

  const automationResult: AutomationResult = {
    status: "MANUAL_REQUIRED",
    requiresManualAction: true,
    manualReason: `El cliente seleccionó la fecha ${selectionResult.selectedOption.date}. La fecha fue revalidada con la disponibilidad actual y queda pendiente de confirmación humana.`,
    selectedDate: selectionResult.selectedDate,
    shouldClose: false,
  };

  await updateContactFlowFromAutomation({
    contactFlow,
    automationResult,
    messageText,
    receivedAt,
    persistedPhone,
    inboundMessageId,
  });

  await syncFollowUpSafely({
    contactFlow,
    automationResult,
    receivedAt,
    inboundText: messageText,
  });

  const reply = buildContactFlowDatePreferenceReceivedMessageTemplate({
    clientName: contactFlow.client.first_name,
    installationName: contactFlow.installation?.description || null,
    countryCode: contactFlow.client.country_code,
    selectedDate: selectionResult.selectedOption.date,
  });

  await sendAndPersistOutboundMessage({
    contactFlow,
    to: persistedPhone ?? contactFlow.client.phone_primary,
    message: reply,
    metadata: {
      purpose: "OPERATIONAL_ZONE_DATE_PREFERENCE_RECORDED",
      selected_option: selectionResult.selectedOption.option,
      selected_date: selectionResult.selectedOption.date,
      operational_zone_id: selectionResult.selectedOption.operational_zone_id,
      operational_zone_visit_date_id:
        selectionResult.selectedOption.operational_zone_visit_date_id,
      source_options_message_id: latestOptionsMessage.messageId,
      availability_checked: true,
      availability_can_offer_day: selectionResult.availability.can_offer_day,
      availability_reason: selectionResult.availability.reason ?? null,
      availability_checked_at: new Date().toISOString(),
      requires_human_confirmation: true,
    },
  });
}

async function handleRegularAutomationResponse(params: {
  contactFlow: EligibleContactFlow;
  baseAutomationResult: AutomationResult;
  messageText: string;
  receivedAt: Date;
  persistedPhone: string | null;
  inboundMessageId: string;
}) {
  const {
    contactFlow,
    baseAutomationResult,
    messageText,
    receivedAt,
    persistedPhone,
    inboundMessageId,
  } = params;

  const availabilityResult = await evaluateContactFlowAvailability(
    contactFlow.contact_flow_id,
  );

  const automationResult = mergeAutomationWithAvailability({
    automationResult: baseAutomationResult,
    availabilityResult,
  });

  await updateContactFlowFromAutomation({
    contactFlow,
    automationResult,
    messageText,
    receivedAt,
    persistedPhone,
    inboundMessageId,
  });

  await syncFollowUpSafely({
    contactFlow,
    automationResult,
    receivedAt,
    inboundText: messageText,
  });

  const autoReply = buildAutomaticReply({
    messageText,
    automationResult,
    clientName: contactFlow.client.first_name,
    installationName: contactFlow.installation?.description || null,
    scheduledDate:
      contactFlow.follow_up.scheduled_date ?? contactFlow.follow_up.target_date,
  });

  if (!autoReply) return;

  await sendAndPersistOutboundMessage({
    contactFlow,
    to: persistedPhone ?? contactFlow.client.phone_primary,
    message: autoReply,
    metadata: {
      purpose: "AUTOMATIC_CONTACT_FLOW_REPLY",
      availability_checked: availabilityResult.checked,
      availability_can_offer_day: availabilityResult.canOfferDay,
      availability_reason: availabilityResult.reason,
      availability_date: availabilityResult.date?.toISOString() ?? null,
      operational_zone_id: availabilityResult.operationalZoneId,
    },
  });
}

async function updateContactFlowFromAutomation(params: {
  contactFlow: EligibleContactFlow;
  automationResult: AutomationResult;
  messageText: string;
  receivedAt: Date;
  persistedPhone: string | null;
  inboundMessageId: string;
}) {
  const {
    contactFlow,
    automationResult,
    messageText,
    receivedAt,
    persistedPhone,
    inboundMessageId,
  } = params;

  await prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: contactFlow.contact_flow_id,
    },
    data: {
      status: automationResult.status,
      requires_manual_action: automationResult.requiresManualAction,
      manual_reason: automationResult.manualReason,
      last_inbound_message: messageText,
      last_message_at: receivedAt,
      contact_phone: persistedPhone ?? undefined,
      selected_date: automationResult.selectedDate,
      closed_at: automationResult.shouldClose ? receivedAt : null,
    },
  });

  await recordStatusChangeIfNeeded({
    contactFlow,
    newStatus: automationResult.status,
    persistedPhone,
    inboundMessageId,
    inboundMessageText: messageText,
    manualReason: automationResult.manualReason,
  });
}

async function recordStatusChangeIfNeeded(params: {
  contactFlow: EligibleContactFlow;
  newStatus: AutomationResult["status"];
  persistedPhone: string | null;
  inboundMessageId: string;
  inboundMessageText: string;
  manualReason: string | null;
}) {
  const {
    contactFlow,
    newStatus,
    persistedPhone,
    inboundMessageId,
    inboundMessageText,
    manualReason,
  } = params;

  if (contactFlow.status === newStatus) {
    return;
  }

  await recordContactStatusChangedActivitySafely({
    clientId: contactFlow.client_id,
    contactFlowId: contactFlow.contact_flow_id,
    followUpId: contactFlow.follow_up_id,
    installationId: contactFlow.installation_id,
    phoneNumber: persistedPhone,
    oldStatus: contactFlow.status,
    newStatus,
    inboundMessageId,
    inboundMessageText,
    manualReason,
  });
}

async function syncFollowUpSafely(params: {
  contactFlow: EligibleContactFlow;
  automationResult: AutomationResult;
  receivedAt: Date;
  inboundText: string;
}) {
  try {
    await syncFollowUpWithAutomation(params);
  } catch (error) {
    console.error(
      "syncFollowUpWithAutomation error:",
      error,
      "follow_up_id:",
      params.contactFlow.follow_up_id,
    );
  }
}

async function sendAndPersistOutboundMessage(params: {
  contactFlow: EligibleContactFlow;
  to: string;
  message: string;
  metadata: Prisma.InputJsonObject;
}): Promise<PersistOutboundMessageResult> {
  const sendResult = await sendWhatsAppTextMessage({
    to: params.to,
    message: params.message,
  });

  const sentAt = new Date();

  await prisma.maintenanceContactMessage.create({
    data: {
      contact_flow_id: params.contactFlow.contact_flow_id,
      direction: "OUTBOUND",
      message_text: params.message,
      wa_message_id:
        sendResult.success && sendResult.wa_message_id
          ? sendResult.wa_message_id
          : `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      phone_number: params.to,
      message_type: "text",
      delivery_status: sendResult.success
        ? sendResult.isMock
          ? "mock-sent"
          : "sent"
        : "failed",
      metadata: {
        ...params.metadata,
        provider: "meta-whatsapp",
        isMock: sendResult.isMock,
        raw: sendResult.success ? (sendResult.raw ?? null) : null,
        error: sendResult.success
          ? null
          : sendResult.error instanceof Error
            ? sendResult.error.message
            : "Automatic WhatsApp reply failed.",
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
      contact_phone: params.to,
    },
  });

  if (!sendResult.success) {
    console.error("Automatic WhatsApp reply failed:", sendResult.error);
  }

  return {
    success: sendResult.success,
    sentAt,
  };
}

function shouldOfferDateOptions(automationResult: AutomationResult) {
  if (
    automationResult.status !== "MANUAL_REQUIRED" ||
    !automationResult.requiresManualAction
  ) {
    return false;
  }

  const manualReason = automationResult.manualReason || "";

  return (
    manualReason.includes("confirmó disponibilidad") ||
    manualReason.includes("reprogramar")
  );
}

async function findEligibleContactFlow(phoneCandidates: string[]) {
  return prisma.maintenanceContactFlow.findFirst({
    where: {
      status: {
        in: [...ACTIVE_FLOW_STATUSES],
      },
      OR: [
        {
          contact_phone: {
            in: phoneCandidates,
          },
        },
        {
          client: {
            phone_primary: {
              in: phoneCandidates,
            },
          },
        },
      ],
    },
    orderBy: [
      { last_message_at: "desc" },
      { updated_at: "desc" },
      { trigger_date: "desc" },
      { created_at: "desc" },
    ],
    include: {
      client: true,
      follow_up: {
        include: {
          follow_up_status: true,
        },
      },
      installation: true,
    },
  });
}
