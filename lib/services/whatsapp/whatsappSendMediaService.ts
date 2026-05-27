import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrCreateAppSettingsService } from "@/lib/services/settingsService";
import { recordContactMessageSentActivitySafely } from "@/lib/services/whatsapp/whatsappActivityLogService";
import {
  sendWhatsAppDocumentMessage,
  sendWhatsAppImageMessage,
} from "@/lib/services/whatsappService";

type SendWhatsappMediaFromContactFlowInput = {
  contactFlowId?: string | null;
  mediaUrl?: string | null;
  mediaType?: "image" | "document" | null;
  caption?: string | null;
  filename?: string | null;
};

type SendWhatsappMediaFromContactFlowResult = {
  status: number;
  body: {
    success: boolean;
    error?: string;
    details?: string;
    isMock?: boolean;
    data?: {
      messageId: string;
      waMessageId: string;
      contactFlowId: string;
      mediaUrl: string;
      mediaType: "image" | "document";
      sentAt: Date | null;
    };
  };
};

export async function sendWhatsappMediaFromContactFlow(
  input: SendWhatsappMediaFromContactFlowInput,
): Promise<SendWhatsappMediaFromContactFlowResult> {
  const contactFlowId = input.contactFlowId?.trim();
  const mediaUrl = input.mediaUrl?.trim();
  const mediaType = input.mediaType;
  const caption = input.caption?.trim();
  const filename = input.filename?.trim();

  if (!contactFlowId) {
    return {
      status: 400,
      body: {
        success: false,
        error: "contactFlowId is required.",
      },
    };
  }

  if (!mediaUrl) {
    return {
      status: 400,
      body: {
        success: false,
        error: "mediaUrl is required.",
      },
    };
  }

  if (!mediaType || !["image", "document"].includes(mediaType)) {
    return {
      status: 400,
      body: {
        success: false,
        error: "mediaType must be image or document.",
      },
    };
  }

  const settings = await getOrCreateAppSettingsService();

  if (!settings.whatsapp_enabled) {
    return {
      status: 409,
      body: {
        success: false,
        error: "WhatsApp is disabled in the general settings.",
      },
    };
  }

  const contactFlow = await prisma.maintenanceContactFlow.findUnique({
    where: {
      contact_flow_id: contactFlowId,
    },
    include: {
      client: {
        select: {
          client_id: true,
          phone_primary: true,
          whatsapp_opt_in: true,
        },
      },
    },
  });

  if (!contactFlow) {
    return {
      status: 404,
      body: {
        success: false,
        error: "Contact flow not found.",
      },
    };
  }

  if (!contactFlow.follow_up_id) {
    return {
      status: 409,
      body: {
        success: false,
        error: "WhatsApp media must be linked to a maintenance contact flow.",
      },
    };
  }

  if (!contactFlow.client?.whatsapp_opt_in) {
    return {
      status: 409,
      body: {
        success: false,
        error: "Client does not allow WhatsApp contact.",
      },
    };
  }

  if (!contactFlow.client.phone_primary) {
    return {
      status: 400,
      body: {
        success: false,
        error: "Client does not have a primary phone number.",
      },
    };
  }

  const result =
    mediaType === "image"
      ? await sendWhatsAppImageMessage({
          to: contactFlow.client.phone_primary,
          mediaUrl,
          caption,
        })
      : await sendWhatsAppDocumentMessage({
          to: contactFlow.client.phone_primary,
          mediaUrl,
          caption,
          filename,
        });

  if (!result.success) {
    return {
      status: 500,
      body: {
        success: false,
        error: "Failed to send WhatsApp media.",
        details:
          result.error instanceof Error
            ? result.error.message
            : "Unknown WhatsApp error.",
        isMock: result.isMock,
      },
    };
  }

  const now = new Date();
  const messageText = caption || filename || mediaUrl;

  const savedMessage = await prisma.maintenanceContactMessage.create({
    data: {
      contact_flow_id: contactFlow.contact_flow_id,
      direction: "OUTBOUND",
      message_text: messageText,
      wa_message_id: result.wa_message_id,
      phone_number: contactFlow.client.phone_primary,
      message_type: mediaType,
      delivery_status: result.isMock ? "mock-sent" : "sent",
      metadata: {
        mediaUrl,
        mediaType,
        caption: caption || null,
        filename: filename || null,
        raw: result.raw ?? null,
      } as Prisma.InputJsonValue,
      sent_at: now,
    },
  });

  await recordContactMessageSentActivitySafely({
    clientId: contactFlow.client_id,
    contactFlowId: contactFlow.contact_flow_id,
    messageId: savedMessage.message_id,
    followUpId: contactFlow.follow_up_id,
    installationId: contactFlow.installation_id,
    phoneNumber: contactFlow.client.phone_primary,
    waMessageId: result.wa_message_id,
    deliveryStatus: savedMessage.delivery_status,
    isMock: result.isMock,
    messageText,
  });

  await prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: contactFlow.contact_flow_id,
    },
    data: {
      status: "WAITING_RESPONSE",
      contact_phone: contactFlow.client.phone_primary,
      last_message_at: now,
      first_message_sent_at: contactFlow.first_message_sent_at ?? now,
    },
  });

  return {
    status: 200,
    body: {
      success: true,
      isMock: result.isMock,
      data: {
        messageId: savedMessage.message_id,
        waMessageId: result.wa_message_id,
        contactFlowId: contactFlow.contact_flow_id,
        mediaUrl,
        mediaType,
        sentAt: savedMessage.sent_at,
      },
    },
  };
}
