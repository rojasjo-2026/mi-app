"use client";

import { useEffect, useMemo, useState } from "react";

import { resolveAppSettings } from "@/lib/config/app-settings";

import type {
  AvailabilityByDateMap,
  CalendarEvent,
} from "../../types";
import { OperationsMonthCalendar } from "./OperationsMonthCalendar";
import { OperationsMonthDayDetail } from "./OperationsMonthDayDetail";
import { OperationsMonthSummary } from "./OperationsMonthSummary";
import {
  addMonths,
  buildMonthDays,
  formatMonthLabel,
  getMonthCapacityAverage,
  getMonthStartDate,
} from "./operationsMonthUtils";

type OperationsMonthViewProps = {
  events: CalendarEvent[];
  selectedDate: string;
  availabilityByDate: AvailabilityByDateMap;
  loadingEvents: boolean;
  loadingAvailability: boolean;
  onMonthChange: (date: string) => void;
  onOpenDay: (date: string) => void;
  onOpenCalendar: (date: string) => void;
};

export function OperationsMonthView({
  events,
  selectedDate,
  availabilityByDate,
  loadingEvents,
  loadingAvailability,
  onMonthChange,
  onOpenDay,
  onOpenCalendar,
}: OperationsMonthViewProps) {
  const locale = resolveAppSettings().locale;

  const days = useMemo(
    () =>
      buildMonthDays({
        selectedDate,
        events,
        availabilityByDate,
      }),
    [availabilityByDate, events, selectedDate],
  );

  const currentMonthDays = useMemo(
    () => days.filter((day) => day.isCurrentMonth),
    [days],
  );

  const [selectedMonthDate, setSelectedMonthDate] = useState(selectedDate);

  useEffect(() => {
    setSelectedMonthDate(selectedDate);
  }, [selectedDate]);

  const selectedDay =
    currentMonthDays.find((day) => day.date === selectedMonthDate) ??
    currentMonthDays[0];

  const totalJobs = currentMonthDays.reduce(
    (total, day) => total + day.totalJobs,
    0,
  );

  const totalInstallations = currentMonthDays.reduce(
    (total, day) => total + day.totalInstallations,
    0,
  );

  const totalMaintenances = currentMonthDays.reduce(
    (total, day) => total + day.totalMaintenances,
    0,
  );

  const blockedDays = currentMonthDays.filter(
    (day) => day.availability && !day.availability.can_offer_day,
  ).length;

  const monthlyCapacityAverage =
    getMonthCapacityAverage(currentMonthDays);

  const monthLabel = formatMonthLabel(selectedDate, locale);

  function handlePreviousMonth() {
    onMonthChange(addMonths(getMonthStartDate(selectedDate), -1));
  }

  function handleNextMonth() {
    onMonthChange(addMonths(getMonthStartDate(selectedDate), 1));
  }

  if (!selectedDay) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Planificación mensual
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Anticipe la carga del mes, identifique días bloqueados o sin
          evaluación y revise la distribución de los trabajos programados.
        </p>
      </div>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <OperationsMonthSummary
            monthLabel={monthLabel}
            totalJobs={totalJobs}
            totalInstallations={totalInstallations}
            totalMaintenances={totalMaintenances}
            blockedDays={blockedDays}
            averageLoadPercentage={monthlyCapacityAverage.percentage}
            totalWorkload={monthlyCapacityAverage.totalWorkload}
            totalCapacity={monthlyCapacityAverage.totalCapacity}
            loadingEvents={loadingEvents}
            loadingAvailability={loadingAvailability}
          />

          <OperationsMonthCalendar
            monthLabel={monthLabel}
            days={days}
            selectedDate={selectedMonthDate}
            loadingAvailability={loadingAvailability}
            onSelectDate={setSelectedMonthDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />
        </div>

        <OperationsMonthDayDetail
          day={selectedDay}
          locale={locale}
          loadingEvents={loadingEvents}
          loadingAvailability={loadingAvailability}
          onOpenDay={onOpenDay}
          onOpenCalendar={onOpenCalendar}
        />
      </section>
    </div>
  );
}
