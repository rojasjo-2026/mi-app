import type { ReactNode } from "react";
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
        <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Control del mantenimiento
        </p>

        <h2 className="text-lg font-semibold text-slate-900">
          Información del mantenimiento
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Estos datos definen el objetivo, prioridad y fechas principales del
          mantenimiento. Cualquier cambio aquí debe mantenerse conectado con el
          cliente y la instalación relacionada.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FieldCard
          label="Fecha objetivo"
          helperText="Fecha principal esperada para dar seguimiento."
        >
          {isEditing ? (
            <DateInput
              value={form.target_date}
              onChange={(value) => onChange("target_date", value)}
            />
          ) : (
            <FieldValue value={targetDateLabel} />
          )}
        </FieldCard>

        <FieldCard
          label="Fecha límite"
          helperText="Última fecha recomendada para atender el mantenimiento."
        >
          {isEditing ? (
            <DateInput
              value={form.due_date}
              onChange={(value) => onChange("due_date", value)}
            />
          ) : (
            <FieldValue value={dueDateLabel} />
          )}
        </FieldCard>

        <FieldCard
          label="Prioridad"
          helperText="Ayuda a ordenar la atención operativa."
        >
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

        <FieldCard
          label="Completado en"
          helperText="Fecha en que el mantenimiento fue cerrado."
        >
          <FieldValue value={completedAtLabel} />
        </FieldCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <FieldCard
          label="Descripción"
          helperText="Motivo o detalle principal del mantenimiento."
        >
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

        <FieldCard
          label="Creado desde"
          helperText="Origen del registro dentro del sistema."
        >
          <FieldValue value={createdFrom} />
        </FieldCard>
      </div>
    </section>
  );
}

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
    />
  );
}

function FieldCard({
  label,
  helperText,
  children,
}: {
  label: string;
  helperText: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      {children}

      <p className="mt-2 text-xs leading-5 text-slate-500">{helperText}</p>
    </div>
  );
}

function FieldValue({ value }: { value: string }) {
  return (
    <p className="mt-2 text-sm font-medium text-slate-800">{value || "-"}</p>
  );
}
