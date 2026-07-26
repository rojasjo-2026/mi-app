import type { OperationsMonthDayData } from "./types";
import { OperationsMonthDayCell } from "./OperationsMonthDayCell";
import { getMonthStatusDotClasses } from "./operationsMonthUtils";
import type { OperationsMonthAvailabilityStatus } from "./types";

type OperationsMonthCalendarProps = {
  monthLabel: string;
  days: OperationsMonthDayData[];
  selectedDate: string;
  loadingAvailability: boolean;
  onSelectDate: (date: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

const weekDayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const legendItems: Array<{
  status: OperationsMonthAvailabilityStatus;
  label: string;
}> = [
  { status: "available", label: "Disponible" },
  { status: "unavailable", label: "No disponible" },
  { status: "unevaluated", label: "Sin evaluación" },
  { status: "loading", label: "Evaluando" },
];

export function OperationsMonthCalendar({
  monthLabel,
  days,
  selectedDate,
  loadingAvailability,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
}: OperationsMonthCalendarProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Calendario de carga y capacidad
          </h2>

          <p className="mt-1 text-sm text-slate-500">{monthLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            aria-label="Mes anterior"
          >
            ‹
          </button>

          <span className="inline-flex h-9 min-w-40 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
            {monthLabel}
          </span>

          <button
            type="button"
            onClick={onNextMonth}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekDayLabels.map((label) => (
              <div
                key={label}
                className="border-r border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600 last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-slate-200">
            {days.map((day) => (
              <OperationsMonthDayCell
                key={day.date}
                day={day}
                selectedDate={selectedDate}
                loadingAvailability={loadingAvailability}
                onSelectDate={onSelectDate}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {legendItems.map((item) => (
            <span key={item.status} className="inline-flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${getMonthStatusDotClasses(
                  item.status,
                )}`}
              />
              {item.label}
            </span>
          ))}
        </div>

        <span>Capacidad basada en trabajos por día</span>
      </div>
    </section>
  );
}
