type OperationsHeaderProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export function OperationsHeader({
  selectedDate,
  onDateChange,
}: OperationsHeaderProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            CLARIUS
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Centro operativo
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Planifique los trabajos por fecha, revise la capacidad del día,
            agrupe visitas y prepare una ruta para abrirla en Google Maps.
          </p>
        </div>

        <label className="w-full max-w-xs space-y-2">
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
    </section>
  );
}
