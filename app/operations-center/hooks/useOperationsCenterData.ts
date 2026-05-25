"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AvailabilityApiResponse,
  AvailabilityData,
  CalendarApiResponse,
  CalendarEvent,
} from "../types";
import { getTodayDate } from "../utils";

export function useOperationsCenterData(countryCode = "CR") {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null,
  );

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

  async function loadCalendarEvents() {
    try {
      setLoadingEvents(true);
      setError("");

      const response = await fetch("/api/calendar", {
        cache: "no-store",
      });

      const result: CalendarApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el calendario.");
      }

      setEvents(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
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
          countryCode,
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

      setAvailability(result.data ?? null);
    } catch (err) {
      setAvailability(null);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar la disponibilidad.",
      );
    } finally {
      setLoadingAvailability(false);
    }
  }

  useEffect(() => {
    void loadCalendarEvents();
  }, []);

  useEffect(() => {
    void loadAvailability(selectedDate);
  }, [selectedDate]);

  return {
    selectedDate,
    setSelectedDate,

    events,
    selectedDateEvents,
    installations,
    maintenances,
    availability,

    loadingEvents,
    loadingAvailability,
    error,
    setError,

    loadCalendarEvents,
    loadAvailability,
  };
}
