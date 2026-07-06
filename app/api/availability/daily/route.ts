import { NextResponse } from "next/server";

import {
  evaluateAvailabilityForDate,
  evaluateAvailabilityForDateRange,
} from "@/lib/availability/availability.service";
import { resolveAppSettings } from "@/lib/config/app-settings";

function getRequiredParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)?.trim();

  if (!value) {
    throw new Error(`El parámetro ${key} es requerido.`);
  }

  return value;
}

function getOptionalNumberParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: number,
) {
  const value = searchParams.get(key);

  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return defaultValue;
  }

  return parsedValue;
}

function getCountryCode(searchParams: URLSearchParams) {
  const countryCode = searchParams.get("country_code")?.trim();

  return countryCode || resolveAppSettings().countryCode;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const countryCode = getCountryCode(searchParams);
    const date = getRequiredParam(searchParams, "date");
    const days = getOptionalNumberParam(searchParams, "days", 1);
    const operationalZoneId = searchParams.get("operational_zone_id");

    const result =
      days > 1
        ? await evaluateAvailabilityForDateRange({
            country_code: countryCode,
            start_date: date,
            days,
            operational_zone_id: operationalZoneId,
          })
        : await evaluateAvailabilityForDate({
            country_code: countryCode,
            date,
            operational_zone_id: operationalZoneId,
          });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/availability/daily error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo evaluar la disponibilidad.",
      },
      { status: 400 },
    );
  }
}
