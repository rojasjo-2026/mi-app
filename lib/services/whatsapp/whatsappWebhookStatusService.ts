import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parseUnixTimestamp } from "@/lib/services/whatsapp/whatsappPhoneService";
import type { WhatsAppWebhookStatus } from "@/lib/services/whatsapp/whatsappWebhookTypes";

export async function handleStatusUpdate(statusEvent: WhatsAppWebhookStatus) {
  const waMessageId = statusEvent.id;
  const deliveryStatus = statusEvent.status;
  const timestamp = parseUnixTimestamp(statusEvent.timestamp);

  if (!waMessageId || !deliveryStatus) return;

  const existingMessage = await prisma.maintenanceContactMessage.findFirst({
    where: {
      wa_message_id: waMessageId,
    },
  });

  if (!existingMessage) {
    console.warn(
      "No local message found for WhatsApp status update:",
      waMessageId,
    );
    return;
  }

  await prisma.maintenanceContactMessage.update({
    where: {
      message_id: existingMessage.message_id,
    },
    data: {
      delivery_status: deliveryStatus,
      metadata: {
        whatsappMessageId: waMessageId,
        status: deliveryStatus,
        recipientId: statusEvent.recipient_id ?? null,
        timestamp: statusEvent.timestamp ?? null,
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: existingMessage.contact_flow_id,
    },
    data: {
      last_message_at: timestamp,
    },
  });
}
