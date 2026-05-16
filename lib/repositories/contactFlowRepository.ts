import {
  Prisma,
  ClientStatus as PrismaClientStatus,
  MaintenanceContactFlowStatus,
  ContactMessageDirection,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type UpdateContactFlowInput = {
  status?: MaintenanceContactFlowStatus;
  contactPhone?: string | null;
  lastInboundMessage?: string | null;
  manualReason?: string | null;
  requiresManualAction?: boolean;
  selectedDate?: Date | null;
  closedAt?: Date | null;
  lastMessageAt?: Date | null;
  firstMessageSentAt?: Date | null;
  reminderCount?: number;
};

type CreateContactMessageInput = {
  contactFlowId: string;
  direction: ContactMessageDirection;
  messageText: string;
  waMessageId?: string | null;
  phoneNumber?: string | null;
  messageType?: string | null;
  deliveryStatus?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  sentAt?: Date | null;
  receivedAt?: Date | null;
};

export async function findContactFlowById(contactFlowId: string) {
  return prisma.maintenanceContactFlow.findUnique({
    where: {
      contact_flow_id: contactFlowId,
    },
    include: {
      client: true,
      installation: {
        include: {
          service_type: true,
        },
      },
      follow_up: {
        include: {
          follow_up_status: true,
        },
      },
      messages: {
        orderBy: {
          created_at: "asc",
        },
      },
    },
  });
}

export async function findContactFlowWithClient(contactFlowId: string) {
  return prisma.maintenanceContactFlow.findUnique({
    where: {
      contact_flow_id: contactFlowId,
    },
    include: {
      client: true,
      installation: true,
      follow_up: true,
    },
  });
}

export async function findLatestActiveFlowByPhone(phoneNumber: string) {
  return prisma.maintenanceContactFlow.findFirst({
    where: {
      OR: [
        { contact_phone: phoneNumber },
        {
          client: {
            phone_primary: phoneNumber,
          },
        },
      ],
      status: {
        in: [
          "PENDING",
          "MESSAGE_SENT",
          "WAITING_RESPONSE",
          "OPTIONS_SENT",
          "DATE_SELECTED",
          "MANUAL_REQUIRED",
        ],
      },
    },
    orderBy: {
      updated_at: "desc",
    },
    include: {
      client: true,
      installation: true,
      follow_up: true,
      messages: {
        orderBy: {
          created_at: "asc",
        },
        take: 50,
      },
    },
  });
}

export async function listContactFlows(filters?: {
  status?: MaintenanceContactFlowStatus | "ALL";
  take?: number;
}) {
  return prisma.maintenanceContactFlow.findMany({
    where: {
      ...(filters?.status && filters.status !== "ALL"
        ? { status: filters.status }
        : {}),
    },
    include: {
      client: true,
      installation: {
        include: {
          service_type: true,
        },
      },
      follow_up: true,
      messages: {
        orderBy: {
          created_at: "desc",
        },
        take: 1,
      },
    },
    orderBy: [{ updated_at: "desc" }, { trigger_date: "asc" }],
    take: filters?.take ?? 100,
  });
}

export async function listPendingFlowsForExecution(referenceDate: Date) {
  return prisma.maintenanceContactFlow.findMany({
    where: {
      trigger_date: {
        lte: referenceDate,
      },
      status: {
        in: ["PENDING", "NO_RESPONSE"],
      },
      client: {
        whatsapp_opt_in: true,
        auto_contact_enabled: true,
        client_status: PrismaClientStatus.ACTIVE,
      },
    },
    include: {
      client: true,
      installation: {
        include: {
          service_type: true,
        },
      },
      follow_up: true,
      messages: {
        orderBy: {
          created_at: "asc",
        },
      },
    },
    orderBy: [{ trigger_date: "asc" }, { created_at: "asc" }],
  });
}

export async function createContactMessage(input: CreateContactMessageInput) {
  return prisma.maintenanceContactMessage.create({
    data: {
      contact_flow_id: input.contactFlowId,
      direction: input.direction,
      message_text: input.messageText,
      wa_message_id: input.waMessageId ?? undefined,
      phone_number: input.phoneNumber ?? undefined,
      message_type: input.messageType ?? "text",
      delivery_status: input.deliveryStatus ?? undefined,
      metadata: input.metadata ?? undefined,
      sent_at: input.sentAt ?? undefined,
      received_at: input.receivedAt ?? undefined,
    },
  });
}

export async function updateContactFlow(
  contactFlowId: string,
  input: UpdateContactFlowInput,
) {
  return prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: contactFlowId,
    },
    data: {
      status: input.status,
      contact_phone:
        input.contactPhone === undefined ? undefined : input.contactPhone,
      last_inbound_message:
        input.lastInboundMessage === undefined
          ? undefined
          : input.lastInboundMessage,
      manual_reason:
        input.manualReason === undefined ? undefined : input.manualReason,
      requires_manual_action:
        input.requiresManualAction === undefined
          ? undefined
          : input.requiresManualAction,
      selected_date:
        input.selectedDate === undefined ? undefined : input.selectedDate,
      closed_at: input.closedAt === undefined ? undefined : input.closedAt,
      last_message_at:
        input.lastMessageAt === undefined ? undefined : input.lastMessageAt,
      first_message_sent_at:
        input.firstMessageSentAt === undefined
          ? undefined
          : input.firstMessageSentAt,
      reminder_count:
        input.reminderCount === undefined ? undefined : input.reminderCount,
    },
  });
}

export async function markFlowAsWaitingResponse(params: {
  contactFlowId: string;
  contactPhone?: string | null;
  firstMessageSentAt?: Date;
  lastMessageAt?: Date;
}) {
  return prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: params.contactFlowId,
    },
    data: {
      status: "WAITING_RESPONSE",
      contact_phone: params.contactPhone ?? undefined,
      first_message_sent_at: params.firstMessageSentAt ?? undefined,
      last_message_at: params.lastMessageAt ?? new Date(),
    },
  });
}

export async function appendOutboundMessage(params: {
  contactFlowId: string;
  messageText: string;
  waMessageId?: string | null;
  phoneNumber?: string | null;
  deliveryStatus?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  sentAt?: Date;
}) {
  const sentAt = params.sentAt ?? new Date();

  return prisma.$transaction(async (tx) => {
    const message = await tx.maintenanceContactMessage.create({
      data: {
        contact_flow_id: params.contactFlowId,
        direction: "OUTBOUND",
        message_text: params.messageText,
        wa_message_id: params.waMessageId ?? undefined,
        phone_number: params.phoneNumber ?? undefined,
        message_type: "text",
        delivery_status: params.deliveryStatus ?? "sent",
        metadata: params.metadata ?? undefined,
        sent_at: sentAt,
      },
    });

    await tx.maintenanceContactFlow.update({
      where: {
        contact_flow_id: params.contactFlowId,
      },
      data: {
        status: "WAITING_RESPONSE",
        contact_phone: params.phoneNumber ?? undefined,
        last_message_at: sentAt,
        first_message_sent_at: sentAt,
      },
    });

    return message;
  });
}

export async function appendInboundMessage(params: {
  contactFlowId: string;
  messageText: string;
  waMessageId?: string | null;
  phoneNumber?: string | null;
  messageType?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  receivedAt?: Date;
}) {
  const receivedAt = params.receivedAt ?? new Date();

  return prisma.$transaction(async (tx) => {
    const message = await tx.maintenanceContactMessage.create({
      data: {
        contact_flow_id: params.contactFlowId,
        direction: "INBOUND",
        message_text: params.messageText,
        wa_message_id: params.waMessageId ?? undefined,
        phone_number: params.phoneNumber ?? undefined,
        message_type: params.messageType ?? "text",
        delivery_status: "received",
        metadata: params.metadata ?? undefined,
        received_at: receivedAt,
      },
    });

    await tx.maintenanceContactFlow.update({
      where: {
        contact_flow_id: params.contactFlowId,
      },
      data: {
        last_inbound_message: params.messageText,
        last_message_at: receivedAt,
        contact_phone: params.phoneNumber ?? undefined,
      },
    });

    return message;
  });
}

export async function updateMessageDeliveryStatus(params: {
  waMessageId: string;
  deliveryStatus: string;
  metadata?: Prisma.InputJsonValue | null;
}) {
  const existingMessage = await prisma.maintenanceContactMessage.findFirst({
    where: {
      wa_message_id: params.waMessageId,
    },
  });

  if (!existingMessage) {
    return null;
  }

  return prisma.maintenanceContactMessage.update({
    where: {
      message_id: existingMessage.message_id,
    },
    data: {
      delivery_status: params.deliveryStatus,
      metadata: params.metadata ?? undefined,
    },
  });
}

export async function closeContactFlow(params: {
  contactFlowId: string;
  status?: MaintenanceContactFlowStatus;
  manualReason?: string | null;
  requiresManualAction?: boolean;
  closedAt?: Date;
}) {
  return prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: params.contactFlowId,
    },
    data: {
      status: params.status ?? "CLOSED",
      manual_reason:
        params.manualReason === undefined ? undefined : params.manualReason,
      requires_manual_action:
        params.requiresManualAction === undefined
          ? undefined
          : params.requiresManualAction,
      closed_at: params.closedAt ?? new Date(),
    },
  });
}
