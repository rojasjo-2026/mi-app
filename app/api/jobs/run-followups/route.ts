import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  buildInitialContactMessage,
  buildReminderMessage,
} from "@/lib/services/contactFlowAutomationService";
import { sendWhatsAppTextMessage } from "@/lib/services/whatsappService";
import {
  listPendingFlowsForExecution,
  appendOutboundMessage,
  updateContactFlow,
} from "@/lib/repositories/contactFlowRepository";

type PendingFlowForExecution = Awaited<
  ReturnType<typeof listPendingFlowsForExecution>
>[number] & {
  client?: {
    client_id: string;
    first_name?: string | null;
    last_name_1?: string | null;
    phone_primary?: string | null;
    whatsapp_opt_in?: boolean | null;
    auto_contact_enabled?: boolean | null;
  } | null;
  installation?: {
    installation_id: string;
    description?: string | null;
    service_type?: {
      name?: string | null;
    } | null;
  } | null;
};

export async function POST() {
  try {
    const now = new Date();

    const flows = (await listPendingFlowsForExecution(
      now,
    )) as PendingFlowForExecution[];

    if (!flows.length) {
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        results: [],
      });
    }

    const results: Array<{
      contactFlowId: string;
      clientId: string;
      phoneNumber: string | null;
      status: "sent" | "failed" | "skipped";
      reason?: string;
      waMessageId?: string;
      isMock?: boolean;
    }> = [];

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const flow of flows) {
      const phoneNumber =
        flow.contact_phone || flow.client?.phone_primary || null;

      if (!flow.client) {
        skipped += 1;
        results.push({
          contactFlowId: flow.contact_flow_id,
          clientId: flow.client_id,
          phoneNumber,
          status: "skipped",
          reason: "Flow does not have an associated client.",
        });
        continue;
      }

      if (!phoneNumber) {
        skipped += 1;
        results.push({
          contactFlowId: flow.contact_flow_id,
          clientId: flow.client_id,
          phoneNumber: null,
          status: "skipped",
          reason: "Client does not have a valid phone number.",
        });
        continue;
      }

      if (!flow.client.whatsapp_opt_in) {
        skipped += 1;
        results.push({
          contactFlowId: flow.contact_flow_id,
          clientId: flow.client_id,
          phoneNumber,
          status: "skipped",
          reason: "Client has not opted in to WhatsApp communication.",
        });
        continue;
      }

      if (!flow.client.auto_contact_enabled) {
        skipped += 1;
        results.push({
          contactFlowId: flow.contact_flow_id,
          clientId: flow.client_id,
          phoneNumber,
          status: "skipped",
          reason: "Automatic contact is disabled for this client.",
        });
        continue;
      }

      const clientName = [flow.client.first_name, flow.client.last_name_1]
        .filter(Boolean)
        .join(" ")
        .trim();

      const installationName =
        flow.installation?.description ||
        flow.installation?.service_type?.name ||
        "your installation";

      const message =
        flow.reminder_count > 0
          ? buildReminderMessage({ clientName })
          : buildInitialContactMessage({
              clientName,
              installationName,
            });

      const sendResult = await sendWhatsAppTextMessage({
        to: phoneNumber,
        message,
      });

      if (!sendResult.success) {
        failed += 1;

        results.push({
          contactFlowId: flow.contact_flow_id,
          clientId: flow.client_id,
          phoneNumber,
          status: "failed",
          reason:
            sendResult.error instanceof Error
              ? sendResult.error.message
              : "Unknown WhatsApp sending error.",
          isMock: sendResult.isMock,
        });

        continue;
      }

      const sentAt = new Date();

      await appendOutboundMessage({
        contactFlowId: flow.contact_flow_id,
        messageText: message,
        waMessageId: sendResult.wa_message_id,
        phoneNumber,
        deliveryStatus: sendResult.isMock ? "mock-sent" : "sent",
        metadata:
          sendResult.raw !== undefined
            ? (sendResult.raw as Prisma.InputJsonValue)
            : undefined,
        sentAt,
      });

      await updateContactFlow(flow.contact_flow_id, {
        status: "WAITING_RESPONSE",
        contactPhone: phoneNumber,
        lastMessageAt: sentAt,
        firstMessageSentAt: flow.first_message_sent_at ?? sentAt,
        reminderCount: flow.reminder_count + 1,
      });

      sent += 1;

      results.push({
        contactFlowId: flow.contact_flow_id,
        clientId: flow.client_id,
        phoneNumber,
        status: "sent",
        waMessageId: sendResult.wa_message_id,
        isMock: sendResult.isMock,
      });
    }

    return NextResponse.json({
      success: true,
      processed: flows.length,
      sent,
      failed,
      skipped,
      executedAt: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("POST /api/jobs/run-followups error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error while running follow-up automation job.",
      },
      { status: 500 },
    );
  }
}
