"use client";

import type { CalendarEvent } from "@/lib/calendar/calendar-types";
import {
  formatDateKey,
  getEventStyle,
  isSameDate,
  weekDays,
} from "@/lib/calendar/calendar-utils";

type Props = {
  weekDates: Date[];
  allEvents: CalendarEvent[];
  today: Date;
  selectedDate: Date;
  onSelectDate: (day: Date) => void;
  onRightClick: (event: React.MouseEvent, day: Date) => void;
};

export default function CalendarWeekView({
  weekDates,
  allEvents,
  today,
  selectedDate,
  onSelectDate,
  onRightClick,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-7 border-b border-slate-200 pb-2">
        {weekDates.map((day, index) => {
          const isToday = isSameDate(day, today);
          const isSelected = isSameDate(day, selectedDate);

          return (
            <button
              key={formatDateKey(day)}
              type="button"
              onClick={() => onSelectDate(day)}
              onContextMenu={(event) => onRightClick(event, day)}
              className={`rounded-xl px-3 py-2 text-center transition hover:bg-slate-50 ${
                isSelected ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide">
                {weekDays[index]}
              </p>
              <p
                className={`mt-1 text-lg font-bold ${
                  isToday && !isSelected ? "text-slate-900" : ""
                }`}
              >
                {day.getDate()}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {weekDates.map((day) => {
          const dayKey = formatDateKey(day);
          const dayEvents = allEvents.filter((event) => event.date === dayKey);
          const isSelected = isSameDate(day, selectedDate);

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDate(day)}
              onContextMenu={(event) => onRightClick(event, day)}
              className={`min-h-96 rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md ${
                isSelected
                  ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900 ring-offset-1"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">
                  {day.toLocaleDateString("es-CR", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>

                {dayEvents.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin eventos</p>
                ) : (
                  dayEvents.map((calendarEvent) => (
                    <div
                      key={calendarEvent.id}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRightClick(event, day);
                      }}
                      className={`rounded-md border px-2 py-1 text-xs font-medium shadow-sm ${getEventStyle(
                        calendarEvent.type,
                      )}`}
                    >
                      {calendarEvent.title}
                    </div>
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
