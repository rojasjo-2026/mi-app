import type {
  AvailabilityByDateMap,
  AvailabilityData,
  CalendarEvent,
} from "../../types";
import type {
  OperationsMonthAvailabilityStatus,
  OperationsMonthDayData,
  OperationsMonthZoneData,
} from "./types";

export function parseDateOnly(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMonthStartDate(dateValue: string) {
  const date = parseDateOnly(dateValue);
  return formatDateOnly(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function addMonths(dateValue: string, months: number) {
  const date = parseDateOnly(dateValue);

  return formatDateOnly(
    new Date(date.getFullYear(), date.getMonth() + months, 1),
  );
}

export function formatMonthLabel(dateValue: string, locale: string) {
  const date = parseDateOnly(dateValue);
  const label = date.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatLongDate(dateValue: string, locale: string) {
  const date = parseDateOnly(dateValue);
  const label = date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getMonthGridDates(dateValue: string) {
  const monthDate = parseDateOnly(dateValue);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
  const totalVisibleDays = Math.ceil(
    (mondayBasedOffset + lastDay.getDate()) / 7,
  ) * 7;

  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayBasedOffset);

  return Array.from({ length: totalVisibleDays }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return date;
  });
}

export function buildMonthDays(params: {
  selectedDate: string;
  events: CalendarEvent[];
  availabilityByDate: AvailabilityByDateMap;
}) {
  const selectedMonth = parseDateOnly(params.selectedDate).getMonth();
  const selectedYear = parseDateOnly(params.selectedDate).getFullYear();

  return getMonthGridDates(params.selectedDate).map<OperationsMonthDayData>(
    (date) => {
      const dateKey = formatDateOnly(date);
      const dateEvents = params.events.filter(
        (event) => event.date === dateKey,
      );

      return {
        date: dateKey,
        isCurrentMonth:
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear,
        events: dateEvents,
        totalJobs: dateEvents.length,
        totalInstallations: dateEvents.filter(
          (event) => event.entity_type === "installation",
        ).length,
        totalMaintenances: dateEvents.filter(
          (event) => event.entity_type === "follow_up",
        ).length,
        availability: params.availabilityByDate[dateKey] ?? null,
      };
    },
  );
}

export function buildMonthZoneDistribution(events: CalendarEvent[]) {
  const groups = new Map<string, OperationsMonthZoneData>();

  events.forEach((event) => {
    const zoneKey = event.operational_zone_id || "NO_ZONE";
    const zoneName = event.operational_zone_name || "Sin agrupación asignada";
    const referenceAddress = event.operational_zone_reference_address || null;

    if (!groups.has(zoneKey)) {
      groups.set(zoneKey, {
        zoneKey,
        zoneName,
        referenceAddress,
        totalJobs: 0,
        totalInstallations: 0,
        totalMaintenances: 0,
      });
    }

    const group = groups.get(zoneKey);

    if (!group) return;

    group.totalJobs += 1;

    if (event.entity_type === "installation") {
      group.totalInstallations += 1;
    }

    if (event.entity_type === "follow_up") {
      group.totalMaintenances += 1;
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.zoneKey === "NO_ZONE") return 1;
    if (b.zoneKey === "NO_ZONE") return -1;

    return b.totalJobs - a.totalJobs;
  });
}

export function getMonthAvailabilityStatus(params: {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
}): OperationsMonthAvailabilityStatus {
  if (params.loadingAvailability) {
    return "loading";
  }

  if (!params.availability) {
    return "unevaluated";
  }

  return params.availability.can_offer_day ? "available" : "unavailable";
}

export function getMonthAvailabilityLabel(
  status: OperationsMonthAvailabilityStatus,
) {
  if (status === "loading") return "Evaluando...";
  if (status === "available") return "Disponible";
  if (status === "unavailable") return "No disponible";

  return "Sin evaluación";
}

export function getMonthAvailabilityClasses(
  status: OperationsMonthAvailabilityStatus,
) {
  if (status === "available") {
    return "text-emerald-700";
  }

  if (status === "unavailable") {
    return "text-rose-700";
  }

  if (status === "loading") {
    return "text-blue-700";
  }

  return "text-slate-500";
}

export function getMonthStatusDotClasses(
  status: OperationsMonthAvailabilityStatus,
) {
  if (status === "available") return "bg-emerald-500";
  if (status === "unavailable") return "bg-rose-500";
  if (status === "loading") return "bg-blue-500";

  return "bg-slate-400";
}

export function getCapacityLabel(availability: AvailabilityData | null) {
  if (!availability) {
    return "—";
  }

  const maxJobs = availability.capacity.max_jobs_per_day;

  if (typeof maxJobs !== "number") {
    return `${availability.workload.total_jobs} / sin límite`;
  }

  return `${availability.workload.total_jobs}/${maxJobs}`;
}

export function getRemainingCapacity(
  availability: AvailabilityData | null,
) {
  if (!availability) {
    return null;
  }

  const configuredRemaining = availability.capacity.remaining_jobs_capacity;

  if (typeof configuredRemaining === "number") {
    return Math.max(0, configuredRemaining);
  }

  const maxJobs = availability.capacity.max_jobs_per_day;

  if (typeof maxJobs !== "number") {
    return null;
  }

  return Math.max(0, maxJobs - availability.workload.total_jobs);
}

export function getMonthCapacityAverage(days: OperationsMonthDayData[]) {
  const evaluatedDays = days.filter((day) => {
    const maxJobs = day.availability?.capacity.max_jobs_per_day;

    return typeof maxJobs === "number" && maxJobs > 0;
  });

  if (evaluatedDays.length === 0) {
    return {
      percentage: null,
      totalWorkload: 0,
      totalCapacity: 0,
    };
  }

  const totals = evaluatedDays.reduce(
    (accumulator, day) => {
      const availability = day.availability;
      const maxJobs = availability?.capacity.max_jobs_per_day;

      if (!availability || typeof maxJobs !== "number" || maxJobs <= 0) {
        return accumulator;
      }

      return {
        totalWorkload:
          accumulator.totalWorkload + availability.workload.total_jobs,
        totalCapacity: accumulator.totalCapacity + maxJobs,
      };
    },
    {
      totalWorkload: 0,
      totalCapacity: 0,
    },
  );

  return {
    percentage:
      totals.totalCapacity > 0
        ? Math.round((totals.totalWorkload / totals.totalCapacity) * 100)
        : null,
    ...totals,
  };
}
