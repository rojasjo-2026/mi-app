import { CalendarNonWorkingDayType } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  DEFAULT_COUNTRY_CODE,
  normalizeCountryCode as normalizeConfiguredCountryCode,
} from "@/lib/config/app-settings";
import { prisma } from "@/lib/prisma";

function parseDateOnly(value: string) {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);

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

function normalizeCountryCode(value: unknown) {
  const cleanValue = String(value || "").trim();

  return normalizeConfiguredCountryCode(cleanValue, DEFAULT_COUNTRY_CODE);
}

function normalizeType(value: unknown) {
  const normalizedType = String(value || CalendarNonWorkingDayType.HOLIDAY)
    .trim()
    .toUpperCase();

  const validTypes = Object.values(CalendarNonWorkingDayType);

  if (validTypes.includes(normalizedType as CalendarNonWorkingDayType)) {
    return normalizedType as CalendarNonWorkingDayType;
  }

  return CalendarNonWorkingDayType.HOLIDAY;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return fallback;
}

function mapNonWorkingDay(nonWorkingDay: {
  calendar_non_working_day_id: string;
  non_working_date: Date;
  title: string;
  description: string | null;
  type: CalendarNonWorkingDayType;
  country_code: string;
  is_recurring_yearly: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: nonWorkingDay.calendar_non_working_day_id,
    date: formatDate(nonWorkingDay.non_working_date),
    type: "non_working",
    title: nonWorkingDay.title,
    description: nonWorkingDay.description,
    non_working_day_type: nonWorkingDay.type,
    country_code: nonWorkingDay.country_code,
    is_recurring_yearly: nonWorkingDay.is_recurring_yearly,
    is_active: nonWorkingDay.is_active,
    created_at: nonWorkingDay.created_at.toISOString(),
    updated_at: nonWorkingDay.updated_at.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const countryCode = searchParams.get("country_code");
    const activeOnly = searchParams.get("active_only") === "true";

    const nonWorkingDays = await prisma.calendarNonWorkingDay.findMany({
      where: {
        ...(countryCode
          ? { country_code: normalizeCountryCode(countryCode) }
          : {}),
        ...(activeOnly ? { is_active: true } : {}),
      },
      orderBy: [{ non_working_date: "asc" }, { title: "asc" }],
    });

    return NextResponse.json(
      {
        success: true,
        data: nonWorkingDays.map(mapNonWorkingDay),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/calendar-non-working-days error:", error);

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

    const nonWorkingDate = parseDateOnly(body.non_working_date);
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const countryCode = normalizeCountryCode(body.country_code);
    const type = normalizeType(body.type);
    const isRecurringYearly = normalizeBoolean(body.is_recurring_yearly, false);

    if (!nonWorkingDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid non-working date",
        },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required",
        },
        { status: 400 },
      );
    }

    const existingNonWorkingDay = await prisma.calendarNonWorkingDay.findFirst({
      where: {
        non_working_date: nonWorkingDate,
        country_code: countryCode,
      },
    });

    if (existingNonWorkingDay) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A non-working day already exists for this date and country.",
          data: mapNonWorkingDay(existingNonWorkingDay),
        },
        { status: 409 },
      );
    }

    const createdNonWorkingDay = await prisma.calendarNonWorkingDay.create({
      data: {
        non_working_date: nonWorkingDate,
        title,
        description: description || null,
        type,
        country_code: countryCode,
        is_recurring_yearly: isRecurringYearly,
        is_active: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: mapNonWorkingDay(createdNonWorkingDay),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/calendar-non-working-days error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Non-working day id is required",
        },
        { status: 400 },
      );
    }

    const currentNonWorkingDay = await prisma.calendarNonWorkingDay.findUnique({
      where: {
        calendar_non_working_day_id: id,
      },
    });

    if (!currentNonWorkingDay) {
      return NextResponse.json(
        {
          success: false,
          message: "Non-working day not found",
        },
        { status: 404 },
      );
    }

    const nextDate =
      body.non_working_date !== undefined
        ? parseDateOnly(body.non_working_date)
        : currentNonWorkingDay.non_working_date;

    if (!nextDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid non-working date",
        },
        { status: 400 },
      );
    }

    const nextCountryCode =
      body.country_code !== undefined
        ? normalizeCountryCode(body.country_code)
        : currentNonWorkingDay.country_code;

    const duplicateNonWorkingDay = await prisma.calendarNonWorkingDay.findFirst(
      {
        where: {
          non_working_date: nextDate,
          country_code: nextCountryCode,
          NOT: {
            calendar_non_working_day_id: id,
          },
        },
      },
    );

    if (duplicateNonWorkingDay) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another non-working day already exists for this date and country.",
        },
        { status: 409 },
      );
    }

    const updatedNonWorkingDay = await prisma.calendarNonWorkingDay.update({
      where: {
        calendar_non_working_day_id: id,
      },
      data: {
        non_working_date: nextDate,
        title:
          body.title !== undefined
            ? String(body.title || "").trim()
            : currentNonWorkingDay.title,
        description:
          body.description !== undefined
            ? String(body.description || "").trim() || null
            : currentNonWorkingDay.description,
        type:
          body.type !== undefined
            ? normalizeType(body.type)
            : currentNonWorkingDay.type,
        country_code: nextCountryCode,
        is_recurring_yearly:
          body.is_recurring_yearly !== undefined
            ? normalizeBoolean(body.is_recurring_yearly, false)
            : currentNonWorkingDay.is_recurring_yearly,
        is_active:
          body.is_active !== undefined
            ? normalizeBoolean(body.is_active, true)
            : currentNonWorkingDay.is_active,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: mapNonWorkingDay(updatedNonWorkingDay),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/calendar-non-working-days error:", error);

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

    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Non-working day id is required",
        },
        { status: 400 },
      );
    }

    await prisma.calendarNonWorkingDay.delete({
      where: {
        calendar_non_working_day_id: id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/calendar-non-working-days error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
