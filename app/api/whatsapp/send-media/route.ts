import { NextResponse } from "next/server";

import { sendWhatsappMediaFromContactFlow } from "@/lib/services/whatsapp/whatsappSendMediaService";

type SendMediaRequestBody = {
  contactFlowId?: string;
  mediaUrl?: string;
  mediaType?: "image" | "document";
  caption?: string;
  filename?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as SendMediaRequestBody;

    const result = await sendWhatsappMediaFromContactFlow({
      contactFlowId: body.contactFlowId,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
      caption: body.caption,
      filename: body.filename,
    });

    return NextResponse.json(result.body, { status: result.status });
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
