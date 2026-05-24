"use client";

type SettingsHeaderProps = {
  settingsId: string | null;
  saving: boolean;
  error: string;
  successMessage: string;
  onSave: () => void;
};

export default function SettingsHeader({
  settingsId,
  saving,
  error,
  successMessage,
  onSave,
}: SettingsHeaderProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Configuración
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Configuración del sistema
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Centralice las reglas generales de la empresa, automatizaciones,
            ubicación, moneda, impuestos, horarios y accesos. Estas
            configuraciones servirán como base para adaptar el sistema al
            entorno operativo de cada negocio.
          </p>

          {settingsId ? (
            <p className="mt-3 text-xs text-slate-400">
              Registro activo: {settingsId}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}
    </section>
  );
}
