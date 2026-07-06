import { NextResponse } from "next/server";

import { resolveAppSettings } from "@/lib/config/app-settings";
import { prisma } from "@/lib/prisma";
import {
  confirmFollowUp,
  findConfirmedFollowUpStatus,
} from "@/lib/repositories/followUpRepository";

function buildOptionsMessage() {
  return `Estas son nuestras fechas disponibles:
1. Mañana
2. Pasado mañana
3. Próxima semana

Responda con el número de su preferencia.`;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getMessageLocale() {
  return resolveAppSettings().locale;
}

function formatDateForMessage(date: Date, locale = getMessageLocale()) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function resolveSelectedDate(option: string, baseDate: Date) {
  const normalizedBaseDate = startOfDay(baseDate);

  if (option === "1") {
    return addDays(normalizedBaseDate, 1);
  }

  if (option === "2") {
    return addDays(normalizedBaseDate, 2);
  }

  if (option === "3") {
    return addDays(normalizedBaseDate, 7);
  }

  return null;
}

function buildConfirmationMessage(selectedDate: Date) {
  return `Perfecto, su mantenimiento quedó programado para el ${formatDateForMessage(selectedDate)}. Si necesita cambiar la fecha, puede responder a este mensaje.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { contact_flow_id, message_text } = body;

    if (!contact_flow_id || !message_text) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing parameters",
        },
        { status: 400 },
      );
    }

    const flow = await prisma.maintenanceContactFlow.findUnique({
      where: {
        contact_flow_id,
      },
      include: {
        follow_up: true,
      },
    });

    if (!flow) {
      return NextResponse.json(
        {
          success: false,
          message: "Flow not found",
        },
        { status: 404 },
      );
    }

    const now = new Date();
    const cleanMessage = String(message_text).trim();

    await prisma.maintenanceContactMessage.create({
      data: {
        contact_flow_id,
        direction: "INBOUND",
        message_text: cleanMessage,
        received_at: now,
      },
    });

    let responseMessage: string | null = null;
    let newStatus = flow.status;
    let selectedDate: Date | null = null;

    if (flow.status === "WAITING_RESPONSE") {
      if (cleanMessage === "1") {
        responseMessage = buildOptionsMessage();
        newStatus = "OPTIONS_SENT";
      } else if (cleanMessage === "2") {
        newStatus = "MANUAL_REQUIRED";
      } else if (cleanMessage === "3") {
        newStatus = "REJECTED";
      } else if (cleanMessage === "4") {
        newStatus = "MANUAL_REQUIRED";
      } else {
        newStatus = "MANUAL_REQUIRED";
      }
    } else if (flow.status === "OPTIONS_SENT") {
      selectedDate = resolveSelectedDate(cleanMessage, now);

      if (!selectedDate) {
        newStatus = "MANUAL_REQUIRED";
      } else {
        responseMessage = buildConfirmationMessage(selectedDate);
        newStatus = "CONFIRMED";

        const confirmedStatus = await findConfirmedFollowUpStatus();

        if (confirmedStatus) {
          await confirmFollowUp(flow.follow_up_id, {
            follow_up_status_id: confirmedStatus.follow_up_status_id,
            scheduled_date: selectedDate,
          });
        } else {
          await prisma.followUp.update({
            where: {
              follow_up_id: flow.follow_up_id,
            },
            data: {
              scheduled_date: selectedDate,
            },
          });
        }
      }
    }

    if (responseMessage) {
      await prisma.maintenanceContactMessage.create({
        data: {
          contact_flow_id,
          direction: "OUTBOUND",
          message_text: responseMessage,
          sent_at: now,
        },
      });
    }

    await prisma.maintenanceContactFlow.update({
      where: {
        contact_flow_id,
      },
      data: {
        status: newStatus,
        last_message_at: now,
        ...(selectedDate ? { selected_date: selectedDate } : {}),
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: newStatus,
        selected_date: selectedDate,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("reply contact flow error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
