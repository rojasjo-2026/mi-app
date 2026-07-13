"use client";

type ClientFormPageHeaderProps = {
  mode: "create" | "edit";
  saving: boolean;
  onBack: () => void;
};

export default function ClientFormPageHeader({
  mode,
  saving,
  onBack,
}: ClientFormPageHeaderProps) {
  const pageTitle = mode === "create" ? "Crear cliente" : "Editar cliente";

  const pageDescription =
    mode === "create"
      ? "Registra la información comercial, contacto, ubicación y reglas financieras del cliente."
      : "Actualiza la información comercial, contacto, ubicación y reglas financieras del cliente.";

  const badgeLabel = mode === "create" ? "Nuevo cliente" : "Editar cliente";

  const submitLabel = saving
    ? "Guardando..."
    : mode === "create"
      ? "Guardar cliente"
      : "Guardar cambios";

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 shadow-sm">
          {badgeLabel}
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {pageTitle}
        </h1>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {pageDescription}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row md:items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← Volver
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </section>
  );
}
