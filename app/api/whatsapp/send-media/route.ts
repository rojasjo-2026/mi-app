import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppDocumentMessage,
  sendWhatsAppImageMessage,
} from "@/lib/services/whatsappService";

type SendMediaRequestBody = {
  contactFlowId?: string;
  mediaUrl?: string;
  mediaType?: "image" | "document";
  caption?: string;
  filename?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendMediaRequestBody;

    const contactFlowId = body.contactFlowId?.trim();
    const mediaUrl = body.mediaUrl?.trim();
    const mediaType = body.mediaType;
    const caption = body.caption?.trim();
    const filename = body.filename?.trim();

    if (!contactFlowId) {
      return NextResponse.json(
        { success: false, error: "contactFlowId is required." },
        { status: 400 },
      );
    }

    if (!mediaUrl) {
      return NextResponse.json(
        { success: false, error: "mediaUrl is required." },
        { status: 400 },
      );
    }

    if (!mediaType || !["image", "document"].includes(mediaType)) {
      return NextResponse.json(
        { success: false, error: "mediaType must be image or document." },
        { status: 400 },
      );
    }

    const contactFlow = await prisma.maintenanceContactFlow.findUnique({
      where: {
        contact_flow_id: contactFlowId,
      },
      include: {
        client: {
          select: {
            phone_primary: true,
          },
        },
      },
    });

    if (!contactFlow) {
      return NextResponse.json(
        { success: false, error: "Contact flow not found." },
        { status: 404 },
      );
    }

    if (!contactFlow.client?.phone_primary) {
      return NextResponse.json(
        {
          success: false,
          error: "Client does not have a primary phone number.",
        },
        { status: 400 },
      );
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
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send WhatsApp media.",
          details:
            result.error instanceof Error
              ? result.error.message
              : "Unknown WhatsApp error.",
          isMock: result.isMock,
        },
        { status: 500 },
      );
    }

    const now = new Date();

    const savedMessage = await prisma.maintenanceContactMessage.create({
      data: {
        contact_flow_id: contactFlow.contact_flow_id,
        direction: "OUTBOUND",
        message_text: caption || filename || mediaUrl,
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
        },
        sent_at: now,
      },
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("POST /api/whatsapp/send-media error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error sending WhatsApp media.",
      },
      { status: 500 },
    );
  }
}
