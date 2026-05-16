import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mapBlockedDate(blockedDate: {
  calendar_blocked_date_id: string;
  blocked_date: Date;
  reason: string | null;
}) {
  return {
    id: blockedDate.calendar_blocked_date_id,
    date: formatDate(blockedDate.blocked_date),
    type: "blocked",
    title: "Fecha bloqueada",
    description: blockedDate.reason || "No disponible para agendar.",
  };
}

export async function GET() {
  try {
    const blockedDates = await prisma.calendarBlockedDate.findMany({
      orderBy: {
        blocked_date: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: blockedDates.map(mapBlockedDate),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/calendar-blocked error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const blockedDate = parseDateOnly(body.blocked_date);
    const reason = String(body.reason || "").trim();

    if (!blockedDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blocked date",
        },
        { status: 400 },
      );
    }

    const existingBlockedDate = await prisma.calendarBlockedDate.findFirst({
      where: {
        blocked_date: blockedDate,
      },
    });

    if (existingBlockedDate) {
      return NextResponse.json(
        {
          success: true,
          data: mapBlockedDate(existingBlockedDate),
          message: "Date already blocked",
        },
        { status: 200 },
      );
    }

    const createdBlockedDate = await prisma.calendarBlockedDate.create({
      data: {
        blocked_date: blockedDate,
        reason: reason || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: mapBlockedDate(createdBlockedDate),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/calendar-blocked error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    const blockedDateId = String(body.id || "").trim();

    if (!blockedDateId) {
      return NextResponse.json(
        {
          success: false,
          message: "Blocked date id is required",
        },
        { status: 400 },
      );
    }

    await prisma.calendarBlockedDate.delete({
      where: {
        calendar_blocked_date_id: blockedDateId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: blockedDateId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/calendar-blocked error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
