"use client";

import type { CalendarEvent } from "@/lib/calendar/calendar-types";
import {
  formatDateKey,
  getEventStyle,
  isSameDate,
  weekDays,
} from "@/lib/calendar/calendar-utils";

type CalendarAvailabilityDay = {
  date: string;
  can_offer_day: boolean;
  reason: string | null;
  workload: {
    total_jobs: number;
    total_installations: number;
    total_maintenances: number;
    has_installation: boolean;
  };
  capacity: {
    max_jobs_per_day: number | null;
    max_installations_per_day: number | null;
    max_maintenances_per_day: number | null;
    remaining_jobs_capacity: number | null;
    remaining_installations_capacity: number | null;
    remaining_maintenances_capacity: number | null;
  };
};

type Props = {
  calendarDays: Array<Date | null>;
  allEvents: CalendarEvent[];
  today: Date;
  selectedDate: Date;
  availabilityByDate?: Record<string, CalendarAvailabilityDay>;
  isLoadingAvailability?: boolean;
  onSelectDate: (day: Date) => void;
  onRightClick: (event: React.MouseEvent, day: Date) => void;
};

function getAvailabilitySummary(availability?: CalendarAvailabilityDay) {
  if (!availability) {
    return null;
  }

  const totalJobs = availability.workload.total_jobs;
  const maxJobs = availability.capacity.max_jobs_per_day;
  const remainingJobs = availability.capacity.remaining_jobs_capacity;

  if (!availability.can_offer_day) {
    return {
      label: "No disponible",
      detail:
        maxJobs !== null
          ? `${totalJobs}/${maxJobs} trabajos`
          : `${totalJobs} trabajos`,
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (maxJobs !== null && remainingJobs !== null) {
    return {
      label: `Quedan ${remainingJobs}`,
      detail: `${totalJobs}/${maxJobs} trabajos`,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Disponible",
    detail: `${totalJobs} trabajos`,
    className: "border-sky-200 bg-sky-50 text-sky-700",
  };
}

export default function CalendarMonthView({
  calendarDays,
  allEvents,
  today,
  selectedDate,
  availabilityByDate = {},
  isLoadingAvailability = false,
  onSelectDate,
  onRightClick,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-7 border-b border-slate-200 pb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-32 rounded-xl border border-dashed border-slate-200 bg-slate-50"
              />
            );
          }

          const dayKey = formatDateKey(day);
          const dayEvents = allEvents.filter((event) => event.date === dayKey);
          const availability = availabilityByDate[dayKey];
          const availabilitySummary = getAvailabilitySummary(availability);
          const isToday = isSameDate(day, today);
          const isSelected = isSameDate(day, selectedDate);

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDate(day)}
              onContextMenu={(event) => onRightClick(event, day)}
              className={`min-h-32 rounded-xl border p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-slate-400 hover:bg-slate-50 hover:shadow-md ${
                isSelected
                  ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900 ring-offset-1"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday ? "bg-slate-900 text-white" : "text-slate-700"
                  }`}
                >
                  {day.getDate()}
                </span>

                {dayEvents.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {isLoadingAvailability ? (
                <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                  <p className="truncate text-[11px] font-semibold text-slate-500">
                    Calculando...
                  </p>
                </div>
              ) : availabilitySummary ? (
                <div
                  className={`mb-2 rounded-lg border px-2 py-1 ${availabilitySummary.className}`}
                >
                  <p className="truncate text-[11px] font-bold">
                    {availabilitySummary.label}
                  </p>
                  <p className="truncate text-[10px]">
                    {availabilitySummary.detail}
                  </p>
                </div>
              ) : null}

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((calendarEvent) => (
                  <div
                    key={calendarEvent.id}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onRightClick(event, day);
                    }}
                    className={`truncate rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition hover:shadow ${getEventStyle(
                      calendarEvent.type,
                    )}`}
                  >
                    {calendarEvent.title}
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <p className="text-xs text-slate-500">
                    +{dayEvents.length - 3} más
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
