import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage } from "@/lib/services/whatsappService";

type SendWhatsAppRequestBody = {
  contactFlowId?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendWhatsAppRequestBody;
    const contactFlowId = body.contactFlowId?.trim();
    const message = body.message?.trim();

    if (!contactFlowId) {
      return NextResponse.json(
        { success: false, error: "contactFlowId is required." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "message is required." },
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

    const result = await sendWhatsAppTextMessage({
      to: contactFlow.client.phone_primary,
      message,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send WhatsApp message.",
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
        message_text: message,
        wa_message_id: result.wa_message_id,
        phone_number: contactFlow.client.phone_primary,
        message_type: "text",
        delivery_status: result.isMock ? "mock-sent" : "sent",
        metadata: result.raw !== undefined ? (result.raw as object) : undefined,
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
        phoneNumber: contactFlow.client.phone_primary,
        sentAt: savedMessage.sent_at,
      },
    });
  } catch (error) {
    console.error("POST /api/whatsapp/send error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error sending WhatsApp message.",
      },
      { status: 500 },
    );
  }
}
