import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  buildAutomaticReply,
  resolveInboundFlowUpdate,
  type AutomationResult,
} from "@/lib/services/contactFlowAutomationService";
import { sendWhatsAppTextMessage } from "@/lib/services/whatsappService";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "dev_verify_token";

const ACTIVE_FLOW_STATUSES = [
  "PENDING",
  "NO_RESPONSE",
  "MESSAGE_SENT",
  "WAITING_RESPONSE",
  "OPTIONS_SENT",
  "DATE_SELECTED",
  "MANUAL_REQUIRED",
] as const;

type WhatsAppWebhookTextMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: {
    body?: string;
  };
};

type WhatsAppWebhookStatus = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
};

type WhatsAppWebhookValue = {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    wa_id?: string;
    profile?: {
      name?: string;
    };
  }>;
  messages?: WhatsAppWebhookTextMessage[];
  statuses?: WhatsAppWebhookStatus[];
};

type WhatsAppWebhookChange = {
  field?: string;
  value?: WhatsAppWebhookValue;
};

type WhatsAppWebhookEntry = {
  id?: string;
  changes?: WhatsAppWebhookChange[];
};

type WhatsAppWebhookPayload = {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
};

type EligibleContactFlow = Awaited<ReturnType<typeof findEligibleContactFlow>>;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json(
    {
      success: false,
      error: "Webhook verification failed.",
    },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WhatsAppWebhookPayload;

    if (!payload.entry?.length) {
      return NextResponse.json({
        success: true,
        message: "No entries to process.",
      });
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        if (value.messages?.length) {
          for (const incomingMessage of value.messages) {
            try {
              await handleIncomingMessage(incomingMessage);
            } catch (error) {
              console.error("handleIncomingMessage error:", error);
            }
          }
        }

        if (value.statuses?.length) {
          for (const statusEvent of value.statuses) {
            try {
              await handleStatusUpdate(statusEvent);
            } catch (error) {
              console.error("handleStatusUpdate error:", error);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/whatsapp/webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected webhook processing error.",
      },
      { status: 500 },
    );
  }
}

async function handleIncomingMessage(message: WhatsAppWebhookTextMessage) {
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

async function handleStatusUpdate(statusEvent: WhatsAppWebhookStatus) {
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

async function syncFollowUpWithAutomation(params: {
  contactFlow: NonNullable<EligibleContactFlow>;
  automationResult: AutomationResult;
  receivedAt: Date;
  inboundText: string;
}) {
  const { contactFlow, automationResult, receivedAt, inboundText } = params;

  const existingNotes = contactFlow.follow_up.notes?.trim();
  const auditLine = buildFollowUpAuditLine({
    receivedAt,
    inboundText,
    automationResult,
  });

  let finalNotes = [existingNotes, auditLine].filter(Boolean).join("\n");

  const data: Prisma.FollowUpUncheckedUpdateInput = {
    notes: finalNotes,
  };

  if (automationResult.status === "CONFIRMED") {
    data.scheduled_date =
      contactFlow.follow_up.scheduled_date ?? contactFlow.follow_up.target_date;

    finalNotes = [
      finalNotes,
      `CONFIRMED FROM WHATSAPP ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n");

    data.notes = finalNotes;

    const confirmedStatusId = await findFollowUpStatusId([
      "confirmed",
      "scheduled",
    ]);

    if (confirmedStatusId) {
      data.follow_up_status_id = confirmedStatusId;
    }
  }

  if (automationResult.status === "MANUAL_REQUIRED") {
    data.due_date = contactFlow.follow_up.due_date ?? receivedAt;

    finalNotes = [
      finalNotes,
      `MANUAL ACTION REQUIRED FROM WHATSAPP ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n");

    data.notes = finalNotes;

    const manualStatusId = await findFollowUpStatusId([
      "manual_required",
      "manual",
      "pending",
    ]);

    if (manualStatusId) {
      data.follow_up_status_id = manualStatusId;
    }
  }

  if (automationResult.status === "REJECTED") {
    data.completed_at = receivedAt;

    finalNotes = [
      finalNotes,
      `REJECTED FROM WHATSAPP ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n");

    data.notes = finalNotes;

    const rejectedStatusId = await findFollowUpStatusId([
      "rejected",
      "cancelled",
      "closed",
      "completed",
    ]);

    if (rejectedStatusId) {
      data.follow_up_status_id = rejectedStatusId;
    }
  }

  console.log("SYNC FOLLOW UP TRIGGERED", {
    followUpId: contactFlow.follow_up_id,
    automationStatus: automationResult.status,
    inboundText,
    data,
  });

  await prisma.followUp.update({
    where: {
      follow_up_id: contactFlow.follow_up_id,
    },
    data,
  });
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

function buildFollowUpAuditLine(params: {
  receivedAt: Date;
  inboundText: string;
  automationResult: AutomationResult;
}) {
  const timestamp = new Intl.DateTimeFormat("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(params.receivedAt);

  return `[WhatsApp ${timestamp}] Cliente respondió "${params.inboundText}". Flujo actualizado a ${params.automationResult.status}.`;
}

function sanitizePhoneNumber(value?: string | null): string | null {
  if (!value) return null;

  const cleaned = value.replace(/\D/g, "");
  return cleaned || null;
}

function normalizePhoneNumber(value?: string | null): string | null {
  const cleaned = sanitizePhoneNumber(value);

  if (!cleaned) return null;

  if (cleaned.startsWith("506")) {
    return cleaned;
  }

  return `506${cleaned}`;
}

function buildPhoneCandidates(
  rawFrom: string | null,
  normalizedFrom: string | null,
) {
  const values = [rawFrom, normalizedFrom].filter((value): value is string =>
    Boolean(value),
  );

  return [...new Set(values)];
}

function parseUnixTimestamp(value?: string): Date {
  if (!value) return new Date();

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return new Date();
  }

  return new Date(numericValue * 1000);
}
