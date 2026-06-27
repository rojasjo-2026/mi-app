import { NextResponse } from "next/server";

import { getCalendarEventsService } from "@/lib/services/calendarService";
import { getOrCreateAppSettingsService } from "@/lib/services/settingsService";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidDateOnly(dateValue: string) {
  if (!DATE_ONLY_PATTERN.test(dateValue)) return false;

  const parsedDate = parseDateOnly(dateValue);

  return formatDateOnly(parsedDate) === dateValue;
}

function normalizeCountryCode(
  value: string | null | undefined,
  fallbackCountryCode: string,
) {
  const countryCode = String(value || "")
    .trim()
    .toUpperCase();

  const fallback = String(fallbackCountryCode || "")
    .trim()
    .toUpperCase();

  return countryCode || fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get("startDate")?.trim() || undefined;
    const endDateParam = searchParams.get("endDate")?.trim() || undefined;

    if (startDateParam && !isValidDateOnly(startDateParam)) {
      return NextResponse.json(
        { success: false, message: "startDate must use YYYY-MM-DD format." },
        { status: 400 },
      );
    }

    if (endDateParam && !isValidDateOnly(endDateParam)) {
      return NextResponse.json(
        { success: false, message: "endDate must use YYYY-MM-DD format." },
        { status: 400 },
      );
    }

    const startDate = startDateParam ?? endDateParam;
    const endDate = endDateParam ?? startDateParam;

    if (
      startDate &&
      endDate &&
      parseDateOnly(startDate) > parseDateOnly(endDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "startDate cannot be greater than endDate.",
        },
        { status: 400 },
      );
    }

    const settings = await getOrCreateAppSettingsService();

    const countryCode = normalizeCountryCode(
      searchParams.get("country_code"),
      settings.country_code,
    );

    const events = await getCalendarEventsService({
      startDate,
      endDate,
      countryCode,
    });

    return NextResponse.json({ success: true, data: events }, { status: 200 });
  } catch (error) {
    console.error("GET /api/calendar error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
