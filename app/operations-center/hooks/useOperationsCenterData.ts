"use client";

import { useEffect, useMemo, useState } from "react";

import { resolveAppSettings } from "@/lib/config/app-settings";

import type {
  AvailabilityApiResponse,
  AvailabilityByDateMap,
  AvailabilityData,
  AvailabilityRangeApiResponse,
  CalendarApiResponse,
  CalendarEvent,
  OperationsViewMode,
} from "../types";
import { getTodayDate } from "../utils";

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

function addDays(dateValue: string, days: number) {
  const date = parseDateOnly(dateValue);
  date.setDate(date.getDate() + days);

  return formatDateOnly(date);
}

function getWeekStartDate(dateValue: string) {
  const date = parseDateOnly(dateValue);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  return formatDateOnly(monday);
}

function getMonthStartDate(dateValue: string) {
  const date = parseDateOnly(dateValue);
  return formatDateOnly(new Date(date.getFullYear(), date.getMonth(), 1));
}

function getMonthDays(dateValue: string) {
  const date = parseDateOnly(dateValue);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getRangeConfig(params: {
  selectedDate: string;
  viewMode: OperationsViewMode;
}) {
  if (params.viewMode === "week") {
    return {
      startDate: getWeekStartDate(params.selectedDate),
      days: 7,
    };
  }

  if (params.viewMode === "month") {
    return {
      startDate: getMonthStartDate(params.selectedDate),
      days: getMonthDays(params.selectedDate),
    };
  }

  return {
    startDate: params.selectedDate,
    days: 1,
  };
}

function buildAvailabilityByDateMap(
  results: AvailabilityData[],
): AvailabilityByDateMap {
  return results.reduce<AvailabilityByDateMap>((accumulator, item) => {
    accumulator[item.date] = item;
    return accumulator;
  }, {});
}

function buildCalendarUrl(params: { startDate: string; endDate: string }) {
  const searchParams = new URLSearchParams();

  searchParams.set("startDate", params.startDate);
  searchParams.set("endDate", params.endDate);

  return `/api/calendar?${searchParams.toString()}`;
}

function getActiveCountryCode(countryCode?: string | null) {
  const cleanCountryCode = countryCode?.trim();

  return (cleanCountryCode || resolveAppSettings().countryCode).toUpperCase();
}

export function useOperationsCenterData(
  countryCode?: string | null,
  viewMode: OperationsViewMode = "day",
) {
  const activeCountryCode = useMemo(
    () => getActiveCountryCode(countryCode),
    [countryCode],
  );

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null,
  );
  const [availabilityByDate, setAvailabilityByDate] =
    useState<AvailabilityByDateMap>({});

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState("");

  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => event.date === selectedDate);
  }, [events, selectedDate]);

  const installations = useMemo(() => {
    return selectedDateEvents.filter(
      (event) => event.entity_type === "installation",
    );
  }, [selectedDateEvents]);

  const maintenances = useMemo(() => {
    return selectedDateEvents.filter(
      (event) => event.entity_type === "follow_up",
    );
  }, [selectedDateEvents]);

  async function loadCalendarEvents(params?: {
    startDate: string;
    endDate: string;
  }) {
    try {
      setLoadingEvents(true);
      setError("");

      const nextParams =
        params ??
        (() => {
          const rangeConfig = getRangeConfig({
            selectedDate,
            viewMode,
          });

          return {
            startDate: rangeConfig.startDate,
            endDate: addDays(rangeConfig.startDate, rangeConfig.days - 1),
          };
        })();

      const response = await fetch(buildCalendarUrl(nextParams), {
        cache: "no-store",
      });

      const result: CalendarApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el calendario.");
      }

      setEvents(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setEvents([]);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar los trabajos.",
      );
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadAvailability(date: string) {
    try {
      setLoadingAvailability(true);
      setError("");

      const response = await fetch(
        `/api/availability/daily?country_code=${encodeURIComponent(
          activeCountryCode,
        )}&date=${encodeURIComponent(date)}`,
        {
          cache: "no-store",
        },
      );

      const result: AvailabilityApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo cargar la disponibilidad.",
        );
      }

      const nextAvailability = result.data ?? null;

      setAvailability(nextAvailability);
      setAvailabilityByDate(
        nextAvailability ? { [nextAvailability.date]: nextAvailability } : {},
      );
    } catch (err) {
      setAvailability(null);
      setAvailabilityByDate({});
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar la disponibilidad.",
      );
    } finally {
      setLoadingAvailability(false);
    }
  }

  async function loadAvailabilityRange(params: {
    startDate: string;
    days: number;
  }) {
    try {
      setLoadingAvailability(true);
      setError("");

      const response = await fetch(
        `/api/availability/daily?country_code=${encodeURIComponent(
          activeCountryCode,
        )}&date=${encodeURIComponent(params.startDate)}&days=${encodeURIComponent(
          String(params.days),
        )}`,
        {
          cache: "no-store",
        },
      );

      const result: AvailabilityRangeApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo cargar la disponibilidad del rango.",
        );
      }

      const rangeResults = result.data?.results ?? [];
      const nextAvailabilityByDate = buildAvailabilityByDateMap(rangeResults);

      setAvailabilityByDate(nextAvailabilityByDate);
      setAvailability(nextAvailabilityByDate[selectedDate] ?? null);
    } catch (err) {
      setAvailability(null);
      setAvailabilityByDate({});
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar la disponibilidad del rango.",
      );
    } finally {
      setLoadingAvailability(false);
    }
  }

  useEffect(() => {
    const rangeConfig = getRangeConfig({
      selectedDate,
      viewMode,
    });

    void loadCalendarEvents({
      startDate: rangeConfig.startDate,
      endDate: addDays(rangeConfig.startDate, rangeConfig.days - 1),
    });
  }, [selectedDate, viewMode]);

  useEffect(() => {
    if (viewMode === "day") {
      void loadAvailability(selectedDate);
      return;
    }

    const rangeConfig = getRangeConfig({
      selectedDate,
      viewMode,
    });

    void loadAvailabilityRange({
      startDate: rangeConfig.startDate,
      days: rangeConfig.days,
    });
  }, [activeCountryCode, selectedDate, viewMode]);

  return {
    selectedDate,
    setSelectedDate,

    events,
    selectedDateEvents,
    installations,
    maintenances,
    availability,
    availabilityByDate,

    loadingEvents,
    loadingAvailability,
    error,
    setError,

    loadCalendarEvents,
    loadAvailability,
    loadAvailabilityRange,
  };
}
