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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            CLARIUS
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Centro operativo
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Planifique los trabajos por fecha, revise la capacidad del día,
            agrupe visitas por rutas configuradas y prepare una ruta para
            abrirla en Google Maps.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 lg:max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <div className="grid grid-cols-3 gap-1">
              {viewModeOptions.map((option) => {
                const isActive = option.value === viewMode;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onViewModeChange(option.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Fecha operativa
            </span>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
