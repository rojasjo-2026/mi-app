import { resolveAppSettings } from "@/lib/config/app-settings";

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v19.0";

const hasRealWhatsAppConfig =
  WHATSAPP_TOKEN &&
  PHONE_NUMBER_ID &&
  WHATSAPP_TOKEN !== "xxxx" &&
  PHONE_NUMBER_ID !== "xxxx";

const BASE_URL = hasRealWhatsAppConfig
  ? `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`
  : "";

type SendWhatsAppTextMessageParams = {
  to: string;
  message: string;
  phoneCountryCode?: string | null;
};

type SendWhatsAppMediaMessageParams = {
  to: string;
  mediaUrl: string;
  caption?: string;
  filename?: string;
  phoneCountryCode?: string | null;
};

type SendWhatsAppMessageResult =
  | {
      success: true;
      wa_message_id: string;
      raw?: unknown;
      isMock: boolean;
    }
  | {
      success: false;
      error: unknown;
      isMock: boolean;
    };

/**
 * Sends a plain text WhatsApp message using Meta Cloud API.
 * Falls back to mock mode when WhatsApp credentials are not configured yet.
 */
export async function sendWhatsAppTextMessage({
  to,
  message,
  phoneCountryCode,
}: SendWhatsAppTextMessageParams): Promise<SendWhatsAppMessageResult> {
  return sendWhatsAppMessage({
    to,
    phoneCountryCode,
    payload: {
      type: "text",
      text: {
        body: message,
      },
    },
    mockRaw: {
      to,
      message,
      phoneCountryCode,
      type: "text",
    },
    logLabel: "Mensaje de texto",
  });
}

/**
 * Sends an image through WhatsApp using a public media URL.
 * The media URL must be publicly accessible by Meta.
 */
export async function sendWhatsAppImageMessage({
  to,
  mediaUrl,
  caption,
  phoneCountryCode,
}: SendWhatsAppMediaMessageParams): Promise<SendWhatsAppMessageResult> {
  return sendWhatsAppMessage({
    to,
    phoneCountryCode,
    payload: {
      type: "image",
      image: {
        link: mediaUrl,
        ...(caption ? { caption } : {}),
      },
    },
    mockRaw: {
      to,
      mediaUrl,
      caption,
      phoneCountryCode,
      type: "image",
    },
    logLabel: "Imagen",
  });
}

/**
 * Sends a document through WhatsApp using a public media URL.
 * The media URL must be publicly accessible by Meta.
 */
export async function sendWhatsAppDocumentMessage({
  to,
  mediaUrl,
  caption,
  filename,
  phoneCountryCode,
}: SendWhatsAppMediaMessageParams): Promise<SendWhatsAppMessageResult> {
  return sendWhatsAppMessage({
    to,
    phoneCountryCode,
    payload: {
      type: "document",
      document: {
        link: mediaUrl,
        ...(caption ? { caption } : {}),
        ...(filename ? { filename } : {}),
      },
    },
    mockRaw: {
      to,
      mediaUrl,
      caption,
      filename,
      phoneCountryCode,
      type: "document",
    },
    logLabel: "Documento",
  });
}

/**
 * Sends predefined reply options as a plain text message.
 * This can later be upgraded to interactive WhatsApp buttons.
 */
export async function sendQuickReplyOptions({
  to,
  header,
  phoneCountryCode,
}: {
  to: string;
  header?: string;
  phoneCountryCode?: string | null;
}) {
  const message = `${header || "Por favor, elija una opción:"}

1. Confirmar cita
2. Reprogramar
3. Ya no me interesa
4. Hablar con un asesor`;

  return sendWhatsAppTextMessage({
    to,
    message,
    phoneCountryCode,
  });
}

async function sendWhatsAppMessage({
  to,
  phoneCountryCode,
  payload,
  mockRaw,
  logLabel,
}: {
  to: string;
  phoneCountryCode?: string | null;
  payload: Record<string, unknown>;
  mockRaw: Record<string, unknown>;
  logLabel: string;
}): Promise<SendWhatsAppMessageResult> {
  if (!hasRealWhatsAppConfig) {
    console.log("Modo de prueba de WhatsApp activado");
    console.log("Tipo:", logLabel);
    console.log("Destino:", to);
    console.log("Payload:", mockRaw);

    return {
      success: true,
      wa_message_id: `mock-${Date.now()}`,
      isMock: true,
      raw: mockRaw,
    };
  }

  try {
    const formattedPhone = formatPhoneNumber(to, phoneCountryCode);

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        ...payload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de la API de WhatsApp:", data);
      throw new Error(
        data?.error?.message || "No se pudo enviar el mensaje de WhatsApp",
      );
    }

    return {
      success: true,
      wa_message_id: data?.messages?.[0]?.id || `wa-${Date.now()}`,
      raw: data,
      isMock: false,
    };
  } catch (error) {
    console.error("sendWhatsAppMessage error:", error);

    return {
      success: false,
      error,
      isMock: false,
    };
  }
}

/**
 * Normalizes phone numbers to the configured international format.
 */
function formatPhoneNumber(
  phone: string,
  phoneCountryCode?: string | null,
): string {
  const cleaned = phone.replace(/\D/g, "");

  if (!cleaned) {
    return cleaned;
  }

  const resolvedPhoneCountryCode =
    phoneCountryCode || resolveAppSettings().phoneCountryCode;

  const cleanedCountryCode = String(resolvedPhoneCountryCode || "").replace(
    /\D/g,
    "",
  );

  if (!cleanedCountryCode) {
    return cleaned;
  }

  if (cleaned.startsWith(cleanedCountryCode)) {
    return cleaned;
  }

  return `${cleanedCountryCode}${cleaned}`;
}
