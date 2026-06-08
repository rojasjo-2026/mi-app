"use client";

type ContactAttemptsHeaderProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

export function ContactAttemptsHeader({
  refreshing,
  onRefresh,
}: ContactAttemptsHeaderProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex min-h-12 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Ubicación actual"
            className="flex min-w-0 items-center gap-2 text-sm font-semibold"
          >
            <span className="truncate text-blue-700">Operaciones 360</span>
            <span className="text-slate-300">/</span>
            <span className="truncate text-slate-800">
              Intentos de contacto
            </span>
          </nav>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Intentos de contacto
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Visualiza el estado de los contactos automáticos, respuestas y
            seguimientos de WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refrescando..." : "Refrescar lista"}
        </button>
      </div>
    </section>
  );
}
