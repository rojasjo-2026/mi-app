import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildAutomaticReply,
  resolveInboundFlowUpdate,
} from "@/lib/services/contactFlowAutomationService";
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

  await prisma.maintenanceContactMessage.create({
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

  const automationResult = resolveInboundFlowUpdate(messageText);

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

  try {
    await syncFollowUpWithAutomation({
      contactFlow,
      automationResult,
      receivedAt,
      inboundText: messageText,
    });
  } catch (error) {
    console.error(
      "syncFollowUpWithAutomation error:",
      error,
      "follow_up_id:",
      contactFlow.follow_up_id,
    );
  }

  const autoReply = buildAutomaticReply({
    messageText,
    clientName: contactFlow.client.first_name,
    installationName: contactFlow.installation?.description || null,
    scheduledDate:
      contactFlow.follow_up.scheduled_date ?? contactFlow.follow_up.target_date,
  });

  if (!autoReply) return;

  const sendResult = await sendWhatsAppTextMessage({
    to: persistedPhone ?? contactFlow.client.phone_primary,
    message: autoReply,
  });

  const sentAt = new Date();

  await prisma.maintenanceContactMessage.create({
    data: {
      contact_flow_id: contactFlow.contact_flow_id,
      direction: "OUTBOUND",
      message_text: autoReply,
      wa_message_id:
        sendResult.success && sendResult.wa_message_id
          ? sendResult.wa_message_id
          : `mock-${Date.now()}`,
      phone_number: persistedPhone ?? undefined,
      message_type: "text",
      delivery_status: sendResult.success
        ? sendResult.isMock
          ? "mock-sent"
          : "sent"
        : "failed",
      metadata: {
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
      contact_flow_id: contactFlow.contact_flow_id,
    },
    data: {
      last_message_at: sentAt,
      contact_phone: persistedPhone ?? undefined,
    },
  });

  if (!sendResult.success) {
    console.error("Automatic WhatsApp reply failed:", sendResult.error);
  }
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
