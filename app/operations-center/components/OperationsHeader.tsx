import type { OperationsViewMode } from "../types";

type OperationsHeaderProps = {
  selectedDate: string;
  viewMode: OperationsViewMode;
  onDateChange: (date: string) => void;
  onViewModeChange: (viewMode: OperationsViewMode) => void;
};

const viewModeOptions: { value: OperationsViewMode; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

export function OperationsHeader({
  selectedDate,
  viewMode,
  onDateChange,
  onViewModeChange,
}: OperationsHeaderProps) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Centro operativo
        </h1>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Planifique los trabajos por fecha, revise la capacidad del día, agrupe
          visitas por rutas configuradas y prepare una ruta para abrirla en
          Google Maps.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Vista</span>

          <div className="inline-flex h-9 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
            {viewModeOptions.map((option) => {
              const isActive = option.value === viewMode;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onViewModeChange(option.value)}
                  className={`inline-flex h-7 items-center justify-center rounded px-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">
            Fecha operativa
          </span>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </label>
      </div>
    </section>
  );
}
