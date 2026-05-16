import type { FollowUpEditForm } from "../utils";

type FollowUpInfoSectionProps = {
  isEditing: boolean;
  form: FollowUpEditForm;
  completedAtLabel: string;
  createdFrom: string;
  targetDateLabel: string;
  dueDateLabel: string;
  reasonLabel: string;
  priorityLabel: string;
  onChange: <K extends keyof FollowUpEditForm>(
    field: K,
    value: FollowUpEditForm[K],
  ) => void;
};

export default function FollowUpInfoSection({
  isEditing,
  form,
  completedAtLabel,
  createdFrom,
  targetDateLabel,
  dueDateLabel,
  reasonLabel,
  priorityLabel,
  onChange,
}: FollowUpInfoSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Información del mantenimiento
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Datos principales y contexto del mantenimiento seleccionado.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FieldCard label="Fecha programada">
          {isEditing ? (
            <input
              type="date"
              value={form.target_date}
              onChange={(e) => onChange("target_date", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          ) : (
            <FieldValue value={targetDateLabel} />
          )}
        </FieldCard>

        <FieldCard label="Fecha límite">
          {isEditing ? (
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => onChange("due_date", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          ) : (
            <FieldValue value={dueDateLabel} />
          )}
        </FieldCard>

        <FieldCard label="Descripción">
          {isEditing ? (
            <input
              type="text"
              value={form.reason}
              onChange={(e) => onChange("reason", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Descripción del mantenimiento"
            />
          ) : (
            <FieldValue value={reasonLabel} />
          )}
        </FieldCard>

        <FieldCard label="Completado en">
          <FieldValue value={completedAtLabel} />
        </FieldCard>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FieldCard label="Prioridad">
          {isEditing ? (
            <select
              value={String(form.priority)}
              onChange={(e) => onChange("priority", Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="1">1 - Alta</option>
              <option value="2">2 - Media</option>
              <option value="3">3 - Baja</option>
            </select>
          ) : (
            <FieldValue value={priorityLabel} />
          )}
        </FieldCard>

        <FieldCard label="Creado desde">
          <FieldValue value={createdFrom} />
        </FieldCard>
      </div>
    </section>
  );
}

function FieldCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}

function FieldValue({ value }: { value: string }) {
  return <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>;
}
