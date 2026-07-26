import type { OperationsWeekDayCard } from "./types";

type OperationsWeekDayCardsProps = {
  dayCards: OperationsWeekDayCard[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

function getStatusClasses(status: OperationsWeekDayCard["status"]) {
  if (status === "Disponible") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "No disponible") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function OperationsWeekDayCards({
  dayCards,
  selectedDate,
  onSelectDate,
}: OperationsWeekDayCardsProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {dayCards.map((dayCard) => {
        const isActive = dayCard.date === selectedDate;

        return (
          <button
            key={dayCard.date}
            type="button"
            onClick={() => onSelectDate(dayCard.date)}
            className={`cursor-pointer rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow ${
              isActive
                ? "border-blue-300 ring-2 ring-blue-100"
                : "border-slate-200"
            }`}
          >
            <p className="text-xs font-semibold tracking-wide text-slate-500">
              {dayCard.dayLabel}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {dayCard.fullDateLabel}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                <p className="text-slate-400">Trabajos</p>
                <p className="font-semibold text-slate-900">
                  {dayCard.totalJobs}
                </p>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                <p className="text-slate-400">Capacidad</p>
                <p className="font-semibold text-slate-900">
                  {dayCard.capacityLabel}
                </p>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                <p className="text-slate-400">Instalaciones</p>
                <p className="font-semibold text-slate-900">
                  {dayCard.totalInstallations}
                </p>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                <p className="text-slate-400">Mantenimientos</p>
                <p className="font-semibold text-slate-900">
                  {dayCard.totalMaintenances}
                </p>
              </div>
            </div>

            <span
              className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(dayCard.status)}`}
            >
              {dayCard.status}
            </span>
          </button>
        );
      })}
    </section>
  );
}
