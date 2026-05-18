type FollowUpActionsSectionProps = {
  postponing: boolean;
  updatingStatus: boolean;
  isCompleted: boolean;
  onNewContact: () => void;
  onPostpone: () => void;
  onComplete: () => void;
};

type ActionCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  disabled?: boolean;
  primary?: boolean;
  onClick: () => void;
};

function ActionCard({
  title,
  description,
  buttonLabel,
  disabled = false,
  primary = false,
  onClick,
}: ActionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={
          primary
            ? "mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            : "mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {buttonLabel}
      </button>
    </article>
  );
}

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
        <h2 className="text-lg font-semibold text-slate-900">
          Centro de acciones
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona las acciones principales del mantenimiento sin perder la
          relación con el cliente y la instalación.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          title="Contacto con cliente"
          description="Registra una llamada, mensaje o seguimiento manual relacionado con este mantenimiento."
          buttonLabel="Registrar contacto"
          primary
          onClick={onNewContact}
        />

        <ActionCard
          title="Reprogramación"
          description="Cambia la fecha objetivo cuando el mantenimiento deba moverse para otro día."
          buttonLabel={postponing ? "Reprogramando..." : "Reprogramar"}
          disabled={postponing || isCompleted}
          onClick={onPostpone}
        />

        <ActionCard
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
          onClick={onComplete}
        />
      </div>

      {isCompleted && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Este mantenimiento ya fue completado. Las acciones de reprogramación y
          cierre quedan bloqueadas para proteger el estado actual.
        </div>
      )}
    </section>
  );
}
