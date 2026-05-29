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
    <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-blue-600 shadow-sm">
          {badgeLabel}
        </div>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          {pageTitle}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {pageDescription}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← Volver
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </section>
  );
}
