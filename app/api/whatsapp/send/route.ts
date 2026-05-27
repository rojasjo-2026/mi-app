import { NextResponse } from "next/server";

import { sendWhatsappTextFromContactFlow } from "@/lib/services/whatsapp/whatsappSendService";

type SendWhatsAppRequestBody = {
  contactFlowId?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as SendWhatsAppRequestBody;

    const result = await sendWhatsappTextFromContactFlow({
      contactFlowId: body.contactFlowId,
      message: body.message,
    });

    return NextResponse.json(result.body, { status: result.status });
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
