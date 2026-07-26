import type { OperationsMonthDayData } from "./types";
import {
  getCapacityLabel,
  getMonthAvailabilityClasses,
  getMonthAvailabilityLabel,
  getMonthAvailabilityStatus,
} from "./operationsMonthUtils";

type OperationsMonthDayCellProps = {
  day: OperationsMonthDayData;
  selectedDate: string;
  loadingAvailability: boolean;
  onSelectDate: (date: string) => void;
};

function getWorkTypeSummary(day: OperationsMonthDayData) {
  if (day.totalInstallations > 0 && day.totalMaintenances > 0) {
    return `${day.totalInstallations} inst. · ${day.totalMaintenances} mant.`;
  }

  if (day.totalInstallations > 0) {
    return `${day.totalInstallations} ${
      day.totalInstallations === 1 ? "instalación" : "instalaciones"
    }`;
  }

  if (day.totalMaintenances > 0) {
    return `${day.totalMaintenances} ${
      day.totalMaintenances === 1 ? "mantenimiento" : "mantenimientos"
    }`;
  }

  return "Sin trabajos";
}

export function OperationsMonthDayCell({
  day,
  selectedDate,
  loadingAvailability,
  onSelectDate,
}: OperationsMonthDayCellProps) {
  if (!day.isCurrentMonth) {
    return (
      <div className="min-h-[116px] border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-slate-300">
        <span className="text-sm font-semibold">
          {new Date(`${day.date}T00:00:00`).getDate()}
        </span>
      </div>
    );
  }

  const isSelected = day.date === selectedDate;
  const status = getMonthAvailabilityStatus({
    availability: day.availability,
    loadingAvailability,
  });

  return (
    <button
      type="button"
      onClick={() => onSelectDate(day.date)}
      aria-pressed={isSelected}
      className={[
        "min-h-[116px] cursor-pointer border-b border-r p-3 text-left transition",
        "hover:bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300",
        isSelected
          ? "relative z-10 border-blue-500 bg-blue-50/40 ring-2 ring-inset ring-blue-500"
          : status === "unavailable"
            ? "border-rose-200 bg-rose-50/50"
            : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={[
            "text-sm font-semibold",
            isSelected
              ? "text-blue-700"
              : status === "unavailable"
                ? "text-rose-700"
                : "text-slate-900",
          ].join(" ")}
        >
          {new Date(`${day.date}T00:00:00`).getDate()}
        </span>

        {status === "unavailable" ? (
          <span
            aria-label="Día no disponible"
            className="text-xs font-semibold text-rose-600"
          >
            ●
          </span>
        ) : null}
      </div>

      <div className="mt-2 space-y-0.5 text-xs leading-5">
        <p className="font-medium text-slate-700">
          {day.totalJobs} {day.totalJobs === 1 ? "trabajo" : "trabajos"}
        </p>

        <p className="truncate text-slate-500">{getWorkTypeSummary(day)}</p>

        <p className="font-semibold text-slate-700">
          {loadingAvailability
            ? "..."
            : getCapacityLabel(day.availability)}
        </p>

        <p
          className={`truncate font-medium ${getMonthAvailabilityClasses(
            status,
          )}`}
        >
          {getMonthAvailabilityLabel(status)}
        </p>
      </div>
    </button>
  );
}
