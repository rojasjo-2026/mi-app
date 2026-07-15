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
  postponing: boolean;
  updatingStatus: boolean;
  isCompleted: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onViewInstallation: () => void;
  onBack: () => void;
  onNewContact: () => void;
  onPostpone: () => void;
  onComplete: () => void;
};

type QuickActionProps = {
  title: string;
  description: string;
  buttonLabel: string;
  disabled?: boolean;
  primary?: boolean;
  success?: boolean;
  onClick: () => void;
};

function QuickAction({
  title,
  description,
  buttonLabel,
  disabled = false,
  primary = false,
  success = false,
  onClick,
}: QuickActionProps) {
  const buttonClassName = primary
    ? "bg-slate-950 text-white hover:bg-slate-800"
    : success
      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <article className="flex min-w-0 flex-col bg-white px-3 py-3">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`mt-3 inline-flex h-9 w-full items-center justify-center rounded-md px-3 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
      >
        {buttonLabel}
      </button>
    </article>
  );
}

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
  postponing,
  updatingStatus,
  isCompleted,
  onEdit,
  onSave,
  onCancel,
  onViewInstallation,
  onBack,
  onNewContact,
  onPostpone,
  onComplete,
}: FollowUpHeaderProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Detalle del mantenimiento
            </p>

            <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              {clientName} · {installationDescription}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${statusClassName}`}
              >
                {statusName}
              </span>

              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${priorityClassName}`}
              >
                {priorityLabel}
              </span>

              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${timingClassName}`}
              >
                {timingLabel}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={savingEdit}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEdit ? "Guardando..." : "Guardar"}
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  disabled={savingEdit}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Editar
              </button>
            )}

            {canViewInstallation ? (
              <button
                type="button"
                onClick={onViewInstallation}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Ver instalación
              </button>
            ) : null}

            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Volver
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-4 md:px-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Acciones rápidas
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Gestiona el contacto, la reprogramación y el cierre del
            mantenimiento.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 md:grid-cols-3">
          <QuickAction
            title="Contacto con cliente"
            description="Registra una llamada, mensaje o seguimiento relacionado con este mantenimiento."
            buttonLabel="Registrar contacto"
            primary
            onClick={onNewContact}
          />

          <QuickAction
            title="Reprogramación"
            description="Cambia la fecha objetivo cuando el mantenimiento deba moverse para otro día."
            buttonLabel={postponing ? "Reprogramando..." : "Reprogramar"}
            disabled={postponing || isCompleted}
            onClick={onPostpone}
          />

          <QuickAction
            title="Cierre del mantenimiento"
            description="Marca el mantenimiento como completado cuando el trabajo ya fue realizado."
            buttonLabel={
              updatingStatus
                ? "Actualizando..."
                : isCompleted
                  ? "Ya completado"
                  : "Marcar como completado"
            }
            disabled={updatingStatus || isCompleted}
            success
            onClick={onComplete}
          />
        </div>

        {isCompleted ? (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-700">
            Este mantenimiento ya fue completado. Las acciones de reprogramación
            y cierre permanecen bloqueadas.
          </div>
        ) : null}
      </div>
    </section>
  );
}
