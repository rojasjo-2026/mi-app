"use client";

import type { CalendarViewMode } from "@/lib/calendar/calendar-types";
import { getViewButtonClass } from "@/lib/calendar/calendar-utils";

type Props = {
  calendarView: CalendarViewMode;
  onChangeView: (view: CalendarViewMode) => void;
  onToday: () => void;
  onCreateMaintenance: () => void;
  isLoadingEvents: boolean;
};

export default function CalendarHeader({
  calendarView,
  onChangeView,
  onToday,
  onCreateMaintenance,
  isLoadingEvents,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Calendario</h1>
        <p className="text-sm text-slate-500">
          Control de mantenimientos, instalaciones y notas del negocio.
        </p>

        {isLoadingEvents && (
          <p className="mt-2 text-sm text-slate-400">
            Cargando eventos del calendario...
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={() => onChangeView("month")}
          className={getViewButtonClass(calendarView === "month")}
        >
          Mes
        </button>

        <button
          type="button"
          onClick={() => onChangeView("week")}
          className={getViewButtonClass(calendarView === "week")}
        >
          Semana
        </button>

        <button
          type="button"
          onClick={() => onChangeView("day")}
          className={getViewButtonClass(calendarView === "day")}
        >
          Día
        </button>

        <button
          type="button"
          onClick={onCreateMaintenance}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
        >
          + Mantenimiento
        </button>
      </div>
    </div>
  );
}
