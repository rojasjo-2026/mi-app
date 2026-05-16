type FollowUpHeaderProps = {
  title: string;
  clientName: string;
  installationDescription: string;
  statusName: string;
  statusClassName: string;
  priorityLabel: string;
  priorityClassName: string;
  timingLabel: string;
  timingClassName: string;
  isEditing: boolean;
  savingEdit: boolean;
  canViewInstallation: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onViewInstallation: () => void;
  onBack: () => void;
};

export default function FollowUpHeader({
  title,
  clientName,
  installationDescription,
  statusName,
  statusClassName,
  priorityLabel,
  priorityClassName,
  timingLabel,
  timingClassName,
  isEditing,
  savingEdit,
  canViewInstallation,
  onEdit,
  onSave,
  onCancel,
  onViewInstallation,
  onBack,
}: FollowUpHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Detalle del mantenimiento
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {clientName} · {installationDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}
          >
            {statusName}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityClassName}`}
          >
            {priorityLabel}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${timingClassName}`}
          >
            {timingLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              disabled={savingEdit}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {savingEdit ? "Guardando..." : "Guardar"}
            </button>

            <button
              onClick={onCancel}
              disabled={savingEdit}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Editar
          </button>
        )}

        {canViewInstallation ? (
          <button
            onClick={onViewInstallation}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ver instalación
          </button>
        ) : null}

        <button
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Volver
        </button>
      </div>
    </section>
  );
}
