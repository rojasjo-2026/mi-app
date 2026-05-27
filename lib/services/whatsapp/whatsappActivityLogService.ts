import type { Prisma } from "@prisma/client";

import { createActivityLog } from "@/lib/repositories/activityLogRepository";

type ContactFlowActivityInput = {
  clientId: string;
  contactFlowId: string;
  followUpId: string;
  installationId?: string | null;
  phoneNumber?: string | null;
  createdBy?: string | null;
};

type ContactMessageActivityInput = {
  clientId: string;
  contactFlowId: string;
  messageId: string;
  followUpId: string;
  installationId?: string | null;
  phoneNumber?: string | null;
  waMessageId?: string | null;
  deliveryStatus?: string | null;
  isMock?: boolean;
  messageText?: string | null;
  createdBy?: string | null;
};

type ContactStatusChangedActivityInput = {
  clientId: string;
  contactFlowId: string;
  followUpId: string;
  installationId?: string | null;
  phoneNumber?: string | null;
  oldStatus?: string | null;
  newStatus: string;
  inboundMessageId?: string | null;
  inboundMessageText?: string | null;
  manualReason?: string | null;
  createdBy?: string | null;
};

export async function recordContactFlowCreatedActivitySafely(
  input: ContactFlowActivityInput,
) {
  try {
    return createActivityLog({
      client_id: input.clientId,
      entity_type: "CONTACT_FLOW",
      entity_id: input.contactFlowId,
      category: "CONTACT",
      action: "CONTACT_FLOW_CREATED",
      visibility: "PUBLIC_INTERNAL",
      title: "WhatsApp contact flow started",
      description: "A WhatsApp contact flow was started for this maintenance.",
      created_by: input.createdBy ?? null,
      metadata: {
        contact_flow_id: input.contactFlowId,
        follow_up_id: input.followUpId,
        installation_id: input.installationId ?? null,
        phone_number: input.phoneNumber ?? null,
        source: "whatsapp",
      } as Prisma.InputJsonValue,
    });
  } catch (error) {
    console.error("Error recording contact flow created activity:", error);
    return null;
  }
}

export async function recordContactMessageSentActivitySafely(
  input: ContactMessageActivityInput,
) {
  try {
    return createActivityLog({
      client_id: input.clientId,
      entity_type: "CONTACT_MESSAGE",
      entity_id: input.messageId,
      category: "CONTACT",
      action: "CONTACT_MESSAGE_SENT",
      visibility: "PUBLIC_INTERNAL",
      title: "WhatsApp message sent",
      description: "A WhatsApp message was sent to the client.",
      created_by: input.createdBy ?? null,
      metadata: {
        contact_flow_id: input.contactFlowId,
        message_id: input.messageId,
        follow_up_id: input.followUpId,
        installation_id: input.installationId ?? null,
        phone_number: input.phoneNumber ?? null,
        wa_message_id: input.waMessageId ?? null,
        delivery_status: input.deliveryStatus ?? null,
        is_mock: input.isMock ?? false,
        message_preview: buildMessagePreview(input.messageText),
        source: "whatsapp",
      } as Prisma.InputJsonValue,
    });
  } catch (error) {
    console.error("Error recording contact message sent activity:", error);
    return null;
  }
}

export async function recordContactMessageReceivedActivitySafely(
  input: ContactMessageActivityInput,
) {
  try {
    return createActivityLog({
      client_id: input.clientId,
      entity_type: "CONTACT_MESSAGE",
      entity_id: input.messageId,
      category: "CONTACT",
      action: "CONTACT_MESSAGE_RECEIVED",
      visibility: "PUBLIC_INTERNAL",
      title: "WhatsApp message received",
      description: "A WhatsApp message was received from the client.",
      created_by: input.createdBy ?? null,
      metadata: {
        contact_flow_id: input.contactFlowId,
        message_id: input.messageId,
        follow_up_id: input.followUpId,
        installation_id: input.installationId ?? null,
        phone_number: input.phoneNumber ?? null,
        wa_message_id: input.waMessageId ?? null,
        delivery_status: input.deliveryStatus ?? null,
        message_preview: buildMessagePreview(input.messageText),
        source: "whatsapp",
      } as Prisma.InputJsonValue,
    });
  } catch (error) {
    console.error("Error recording contact message received activity:", error);
    return null;
  }
}

export async function recordContactStatusChangedActivitySafely(
  input: ContactStatusChangedActivityInput,
) {
  try {
    return createActivityLog({
      client_id: input.clientId,
      entity_type: "CONTACT_FLOW",
      entity_id: input.contactFlowId,
      category: "CONTACT",
      action: "CONTACT_STATUS_CHANGED",
      visibility: "PUBLIC_INTERNAL",
      title: "WhatsApp contact status changed",
      description: `WhatsApp contact flow changed from ${input.oldStatus ?? "unknown"} to ${input.newStatus}.`,
      created_by: input.createdBy ?? null,
      metadata: {
        contact_flow_id: input.contactFlowId,
        follow_up_id: input.followUpId,
        installation_id: input.installationId ?? null,
        phone_number: input.phoneNumber ?? null,
        old_status: input.oldStatus ?? null,
        new_status: input.newStatus,
        inbound_message_id: input.inboundMessageId ?? null,
        inbound_message_preview: buildMessagePreview(input.inboundMessageText),
        manual_reason: input.manualReason ?? null,
        source: "whatsapp",
      } as Prisma.InputJsonValue,
    });
  } catch (error) {
    console.error("Error recording contact status changed activity:", error);
    return null;
  }
}

function buildMessagePreview(messageText?: string | null) {
  const value = messageText?.trim();

  if (!value) {
    return null;
  }

  return value.length > 160 ? `${value.slice(0, 160)}...` : value;
}
