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
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Configuración
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Configuración del sistema
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Centralice los datos de la empresa, automatizaciones, configuración
            regional, agenda operativa y accesos del sistema.
          </p>

          {settingsId ? (
            <p className="mt-2 text-xs text-slate-400">
              Registro activo: {settingsId}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}
    </section>
  );
}
