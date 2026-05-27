import { prisma } from "@/lib/prisma";
import { getOrCreateAppSettingsService } from "@/lib/services/settingsService";
import { recordContactMessageSentActivitySafely } from "@/lib/services/whatsapp/whatsappActivityLogService";
import { sendWhatsAppTextMessage } from "@/lib/services/whatsappService";

type SendWhatsappTextFromContactFlowInput = {
  contactFlowId?: string | null;
  message?: string | null;
};

type SendWhatsappTextFromContactFlowResult = {
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
      phoneNumber: string;
      sentAt: Date | null;
    };
  };
};

export async function sendWhatsappTextFromContactFlow(
  input: SendWhatsappTextFromContactFlowInput,
): Promise<SendWhatsappTextFromContactFlowResult> {
  const contactFlowId = input.contactFlowId?.trim();
  const message = input.message?.trim();

  if (!contactFlowId) {
    return {
      status: 400,
      body: {
        success: false,
        error: "contactFlowId is required.",
      },
    };
  }

  if (!message) {
    return {
      status: 400,
      body: {
        success: false,
        error: "message is required.",
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
          country_code: true,
          whatsapp_opt_in: true,
          auto_contact_enabled: true,
          first_name: true,
          last_name_1: true,
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
        error:
          "WhatsApp messages must be linked to a maintenance contact flow.",
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

  const result = await sendWhatsAppTextMessage({
    to: contactFlow.client.phone_primary,
    message,
  });

  if (!result.success) {
    return {
      status: 500,
      body: {
        success: false,
        error: "Failed to send WhatsApp message.",
        details:
          result.error instanceof Error
            ? result.error.message
            : "Unknown WhatsApp error.",
        isMock: result.isMock,
      },
    };
  }

  const now = new Date();

  const savedMessage = await prisma.maintenanceContactMessage.create({
    data: {
      contact_flow_id: contactFlow.contact_flow_id,
      direction: "OUTBOUND",
      message_text: message,
      wa_message_id: result.wa_message_id,
      phone_number: contactFlow.client.phone_primary,
      message_type: "text",
      delivery_status: result.isMock ? "mock-sent" : "sent",
      metadata: result.raw !== undefined ? (result.raw as object) : undefined,
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
    messageText: message,
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
        phoneNumber: contactFlow.client.phone_primary,
        sentAt: savedMessage.sent_at,
      },
    },
  };
}
