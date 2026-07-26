"use client";

import { useEffect, useMemo, useState } from "react";

import { getEventBadgeClasses, getEventTypeLabel } from "../../utils";
import type { OperationsMonthDayData } from "./types";
import {
  formatLongDate,
  getCapacityLabel,
  getMonthAvailabilityClasses,
  getMonthAvailabilityLabel,
  getMonthAvailabilityStatus,
  getRemainingCapacity,
} from "./operationsMonthUtils";
import { OperationsMonthZoneDistribution } from "./OperationsMonthZoneDistribution";

type OperationsMonthDayDetailProps = {
  day: OperationsMonthDayData;
  locale: string;
  loadingEvents: boolean;
  loadingAvailability: boolean;
  onOpenDay: (date: string) => void;
  onOpenCalendar: (date: string) => void;
};

function getRemainingCapacityLabel(day: OperationsMonthDayData) {
  if (!day.availability) {
    return "Sin evaluación";
  }

  const remainingCapacity = getRemainingCapacity(day.availability);

  if (remainingCapacity === null) {
    return "Sin límite";
  }

  if (remainingCapacity === 0) {
    return "Sin espacios";
  }

  if (remainingCapacity === 1) {
    return "1 espacio";
  }

  return `${remainingCapacity} espacios`;
}

function getAvailabilityReason(day: OperationsMonthDayData) {
  if (!day.availability) {
    return "La disponibilidad no ha sido calculada para esta fecha.";
  }

  if (day.availability.reason) {
    return day.availability.reason;
  }

  return day.availability.can_offer_day
    ? "El día puede ofrecerse según las reglas configuradas."
    : "El día no está disponible según las reglas configuradas.";
}

export function OperationsMonthDayDetail({
  day,
  locale,
  loadingEvents,
  loadingAvailability,
  onOpenDay,
  onOpenCalendar,
}: OperationsMonthDayDetailProps) {
  const [showAllJobs, setShowAllJobs] = useState(false);

  useEffect(() => {
    setShowAllJobs(false);
  }, [day.date]);

  const status = getMonthAvailabilityStatus({
    availability: day.availability,
    loadingAvailability,
  });

  const visibleEvents = useMemo(
    () => (showAllJobs ? day.events : day.events.slice(0, 3)),
    [day.events, showAllJobs],
  );

  return (
    <aside className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100vh-96px)] xl:overflow-y-auto">
      <div className="px-4 py-4">
        <h2 className="text-base font-semibold text-slate-950">
          Detalle del día seleccionado
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {formatLongDate(day.date, locale)}
        </p>

        <span
          className={`mt-3 inline-flex rounded-full border border-current/20 bg-current/5 px-2.5 py-1 text-xs font-semibold ${getMonthAvailabilityClasses(
            status,
          )}`}
        >
          {getMonthAvailabilityLabel(status)}
        </span>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Capacidad
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              {loadingAvailability ? "..." : getCapacityLabel(day.availability)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Espacios disponibles
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              {loadingAvailability
                ? "..."
                : getRemainingCapacityLabel(day)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Motivo
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              {loadingAvailability
                ? "Evaluando disponibilidad..."
                : getAvailabilityReason(day)}
            </p>
          </div>
        </div>
      </div>

      <OperationsMonthZoneDistribution events={day.events} />

      <section className="border-t border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-950">
            Trabajos del día ({day.totalJobs})
          </h3>

          {day.events.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAllJobs((current) => !current)}
              className="cursor-pointer text-xs font-semibold text-blue-700 transition hover:text-blue-800"
            >
              {showAllJobs ? "Mostrar menos" : "Ver todos"}
            </button>
          ) : null}
        </div>

        <div
          className={[
            "mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200",
            showAllJobs ? "max-h-[260px] overflow-y-auto" : "",
          ].join(" ")}
        >
          {loadingEvents ? (
            <div className="px-3 py-4 text-sm text-slate-500">
              Cargando trabajos...
            </div>
          ) : visibleEvents.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-500">
              No hay trabajos programados para esta fecha.
            </div>
          ) : (
            visibleEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {event.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {event.description || "Sin descripción registrada."}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getEventBadgeClasses(
                    event,
                  )}`}
                >
                  {getEventTypeLabel(event)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="space-y-2 border-t border-slate-200 px-4 py-4">
        <button
          type="button"
          onClick={() => onOpenDay(day.date)}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Ir a vista Día
        </button>

        <button
          type="button"
          onClick={() => onOpenCalendar(day.date)}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Abrir en Calendario
        </button>
      </div>
    </aside>
  );
}
