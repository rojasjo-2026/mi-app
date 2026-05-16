type FollowUpActionsSectionProps = {
  postponing: boolean;
  updatingStatus: boolean;
  isCompleted: boolean;
  onNewContact: () => void;
  onPostpone: () => void;
  onComplete: () => void;
};

export default function FollowUpActionsSection({
  postponing,
  updatingStatus,
  isCompleted,
  onNewContact,
  onPostpone,
  onComplete,
}: FollowUpActionsSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Acciones</h2>
        <p className="mt-1 text-sm text-slate-500">
          Acciones rápidas disponibles para este mantenimiento.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          onClick={onNewContact}
          className="rounded-xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Registrar contacto con cliente
        </button>

        <button
          onClick={onPostpone}
          disabled={postponing}
          className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {postponing ? "Reprogramando..." : "Reprogramar mantenimiento"}
        </button>

        <button
          onClick={onComplete}
          disabled={updatingStatus || isCompleted}
          className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {updatingStatus
            ? "Actualizando..."
            : isCompleted
              ? "Mantenimiento completado"
              : "Marcar como completado"}
        </button>
      </div>
    </section>
  );
}
