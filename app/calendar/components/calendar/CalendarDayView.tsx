"use client";

import type { CalendarEvent } from "@/lib/calendar/calendar-types";

type Props = {
  selectedDate: Date;
  selectedEvents: CalendarEvent[];
  renderEventCard: (event: CalendarEvent) => React.ReactNode;
};

export default function CalendarDayView({
  selectedDate,
  selectedEvents,
  renderEventCard,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-5">
        <p className="text-sm text-slate-500">Vista diaria</p>
        <h3 className="text-2xl font-bold capitalize text-slate-900">
          {selectedDate.toLocaleDateString("es-CR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h3>
      </div>

      <div className="space-y-3">
        {selectedEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No hay eventos registrados para este día.
          </div>
        ) : (
          selectedEvents.map((event) => renderEventCard(event))
        )}
      </div>
    </div>
  );
}
