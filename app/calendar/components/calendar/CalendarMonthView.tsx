"use client";

import type { CalendarEvent } from "@/lib/calendar/calendar-types";
import {
  formatDateKey,
  getEventStyle,
  isSameDate,
  weekDays,
} from "@/lib/calendar/calendar-utils";

type Props = {
  calendarDays: Array<Date | null>;
  allEvents: CalendarEvent[];
  today: Date;
  selectedDate: Date;
  onSelectDate: (day: Date) => void;
  onRightClick: (event: React.MouseEvent, day: Date) => void;
};

export default function CalendarMonthView({
  calendarDays,
  allEvents,
  today,
  selectedDate,
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
