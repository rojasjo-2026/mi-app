import { NextResponse } from "next/server";

import { handleIncomingMessage } from "@/lib/services/whatsapp/whatsappWebhookMessageService";
import { handleStatusUpdate } from "@/lib/services/whatsapp/whatsappWebhookStatusService";
import type { WhatsAppWebhookPayload } from "@/lib/services/whatsapp/whatsappWebhookTypes";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "dev_verify_token";

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
