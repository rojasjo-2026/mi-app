import { resolveAppSettings } from "@/lib/config/app-settings";

import type {
  AvailabilityByDateMap,
  AvailabilityData,
  CalendarEvent,
} from "../../types";
import type {
  OperationsWeekDayCard,
  OperationsWeekDayDetail,
  OperationsWeekDayStatus,
  OperationsWeekSummary,
  OperationsWeekZoneDistributionItem,
} from "./types";

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

function getWeekStartDate(selectedDate: string) {
  const date = parseDateOnly(selectedDate);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  return monday;
}

function getWeekDates(selectedDate: string) {
  const weekStart = getWeekStartDate(selectedDate);

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + offset);

    return formatDateOnly(date);
  });
}

function getDayLabels(dateValue: string) {
  const locale = resolveAppSettings().locale;
  const date = parseDateOnly(dateValue);

  const dayLabel = date.toLocaleDateString(locale, {
    weekday: "short",
  });

  const fullDateLabel = date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return {
    dayLabel: dayLabel.replace(".", "").replace(/,$/, "").toUpperCase(),
    fullDateLabel,
  };
}

function getDayStatus(params: {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
}): OperationsWeekDayStatus {
  if (params.loadingAvailability) {
    return "Evaluando";
  }

  if (!params.availability) {
    return "Sin evaluación";
  }

  return params.availability.can_offer_day ? "Disponible" : "No disponible";
}

function getCapacityLabel(params: {
  availability: AvailabilityData | null;
  totalJobs: number;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "Evaluando";
  }

  if (!params.availability) {
    return "Sin evaluación";
  }

  const maxJobs = params.availability.capacity.max_jobs_per_day;

  if (typeof maxJobs !== "number") {
    return `${params.totalJobs}/Sin límite`;
  }

  return `${params.totalJobs}/${maxJobs}`;
}

function getRemainingCapacityLabel(availability: AvailabilityData | null) {
  if (!availability) {
    return "Sin evaluación";
  }

  const configuredRemaining = availability.capacity.remaining_jobs_capacity;

  if (typeof configuredRemaining === "number") {
    if (configuredRemaining <= 0) {
      return "Sin espacios disponibles";
    }

    if (configuredRemaining === 1) {
      return "1 espacio disponible";
    }

    return `${configuredRemaining} espacios disponibles`;
  }

  const maxJobs = availability.capacity.max_jobs_per_day;

  if (typeof maxJobs !== "number") {
    return "Sin límite";
  }

  const remaining = Math.max(0, maxJobs - availability.workload.total_jobs);

  if (remaining === 0) {
    return "Sin espacios disponibles";
  }

  if (remaining === 1) {
    return "1 espacio disponible";
  }

  return `${remaining} espacios disponibles`;
}

function buildEventsByDate(events: CalendarEvent[]) {
  return events.reduce<Record<string, CalendarEvent[]>>(
    (accumulator, event) => {
      const currentEvents = accumulator[event.date] ?? [];
      currentEvents.push(event);
      accumulator[event.date] = currentEvents;

      return accumulator;
    },
    {},
  );
}

export function buildOperationsWeekDayCards(params: {
  selectedDate: string;
  events: CalendarEvent[];
  availabilityByDate: AvailabilityByDateMap;
  loadingAvailability: boolean;
}) {
  const dates = getWeekDates(params.selectedDate);
  const eventsByDate = buildEventsByDate(params.events);

  return dates.map<OperationsWeekDayCard>((date) => {
    const dayEvents = eventsByDate[date] ?? [];
    const totalInstallations = dayEvents.filter(
      (event) => event.entity_type === "installation",
    ).length;
    const totalMaintenances = dayEvents.filter(
      (event) => event.entity_type === "follow_up",
    ).length;
    const availability = params.availabilityByDate[date] ?? null;

    const { dayLabel, fullDateLabel } = getDayLabels(date);

    return {
      date,
      dayLabel,
      fullDateLabel,
      totalJobs: dayEvents.length,
      totalInstallations,
      totalMaintenances,
      capacityLabel: getCapacityLabel({
        availability,
        totalJobs: dayEvents.length,
        loadingAvailability: params.loadingAvailability,
      }),
      status: getDayStatus({
        availability,
        loadingAvailability: params.loadingAvailability,
      }),
      availability,
    };
  });
}

export function buildOperationsWeekSummary(dayCards: OperationsWeekDayCard[]) {
  const totalJobs = dayCards.reduce((accumulator, dayCard) => {
    return accumulator + dayCard.totalJobs;
  }, 0);

  const daysWithActivity = dayCards.reduce((accumulator, dayCard) => {
    return dayCard.totalJobs > 0 ? accumulator + 1 : accumulator;
  }, 0);

  const blockedDays = dayCards.reduce((accumulator, dayCard) => {
    return dayCard.status === "No disponible" ? accumulator + 1 : accumulator;
  }, 0);

  const loadSamples = dayCards
    .map((dayCard) => {
      const availability = dayCard.availability;
      if (!availability) {
        return null;
      }

      const maxJobs = availability.capacity.max_jobs_per_day;
      if (typeof maxJobs !== "number" || maxJobs <= 0) {
        return null;
      }

      return (availability.workload.total_jobs / maxJobs) * 100;
    })
    .filter((sample): sample is number => typeof sample === "number");

  const averageWeeklyLoadPct =
    loadSamples.length > 0
      ? loadSamples.reduce((accumulator, sample) => accumulator + sample, 0) /
        loadSamples.length
      : null;

  return {
    totalJobs,
    daysWithActivity,
    blockedDays,
    averageWeeklyLoadPct,
    averageWeeklyLoadSampleSize: loadSamples.length,
  } satisfies OperationsWeekSummary;
}

export function buildOperationsWeekZoneDistribution(params: {
  selectedDate: string;
  events: CalendarEvent[];
}) {
  const dayEvents = params.events.filter(
    (event) => event.date === params.selectedDate,
  );
  const zones = new Map<string, OperationsWeekZoneDistributionItem>();

  dayEvents.forEach((event) => {
    const zoneKey = event.operational_zone_id || "NO_ZONE";
    const zoneName = event.operational_zone_name || "Sin agrupación asignada";
    const referenceAddress = event.operational_zone_reference_address || null;

    if (!zones.has(zoneKey)) {
      zones.set(zoneKey, {
        zoneKey,
        zoneName,
        referenceAddress,
        totalJobs: 0,
        totalInstallations: 0,
        totalMaintenances: 0,
        events: [],
      });
    }

    const zone = zones.get(zoneKey);
    if (!zone) {
      return;
    }

    zone.totalJobs += 1;
    zone.events.push(event);

    if (event.entity_type === "installation") {
      zone.totalInstallations += 1;
    }

    if (event.entity_type === "follow_up") {
      zone.totalMaintenances += 1;
    }
  });

  return Array.from(zones.values()).sort((a, b) => {
    if (a.zoneKey === "NO_ZONE") return 1;
    if (b.zoneKey === "NO_ZONE") return -1;

    return b.totalJobs - a.totalJobs;
  });
}

export function buildOperationsWeekDayDetail(params: {
  selectedDate: string;
  dayCards: OperationsWeekDayCard[];
  events: CalendarEvent[];
}) {
  const dayCard = params.dayCards.find(
    (item) => item.date === params.selectedDate,
  );
  const selectedDateEvents = params.events.filter(
    (event) => event.date === params.selectedDate,
  );

  if (!dayCard) {
    return null;
  }

  return {
    status: dayCard.status,
    capacityLabel: dayCard.capacityLabel,
    remainingCapacityLabel: getRemainingCapacityLabel(dayCard.availability),
    blockedReason: dayCard.availability?.reason || null,
    events: selectedDateEvents,
    availability: dayCard.availability,
  } satisfies OperationsWeekDayDetail;
}
