import type { ReactNode } from "react";
import type { FollowUpEditForm } from "../utils";

export type OperationalZoneVisitDateSuggestion = {
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
  visit_date: string;
  can_offer_day: true;
  reason: string;
};

type FollowUpInfoSectionProps = {
  isEditing: boolean;
  form: FollowUpEditForm;
  completedAtLabel: string;
  createdFrom: string;
  targetDateLabel: string;
  dueDateLabel: string;
  reasonLabel: string;
  priorityLabel: string;
  visitDateSuggestions: OperationalZoneVisitDateSuggestion[];
  loadingVisitDateSuggestions: boolean;
  visitDateSuggestionsMessage: string;
  visitDateSuggestionsError: string;
  locale: string;
  onChange: <K extends keyof FollowUpEditForm>(
    field: K,
    value: FollowUpEditForm[K],
  ) => void;
};

const controlClassName =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

function formatSuggestedVisitDate(value: string, locale: string) {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
}

export default function FollowUpInfoSection({
  isEditing,
  form,
  completedAtLabel,
  createdFrom,
  targetDateLabel,
  dueDateLabel,
  reasonLabel,
  priorityLabel,
  visitDateSuggestions,
  loadingVisitDateSuggestions,
  visitDateSuggestionsMessage,
  visitDateSuggestionsError,
  locale,
  onChange,
}: FollowUpInfoSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Control del mantenimiento
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Estos datos definen el objetivo, prioridad y fechas principales del
          mantenimiento.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        <FieldCell
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
        </FieldCell>

        <FieldCell
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
        </FieldCell>

        <FieldCell
          label="Prioridad"
          helperText="Ayuda a ordenar la atención operativa."
        >
          {isEditing ? (
            <select
              value={String(form.priority)}
              onChange={(e) => onChange("priority", Number(e.target.value))}
              className={controlClassName}
            >
              <option value="1">1 - Alta</option>
              <option value="2">2 - Media</option>
              <option value="3">3 - Baja</option>
            </select>
          ) : (
            <FieldValue value={priorityLabel} />
          )}
        </FieldCell>

        <FieldCell
          label="Completado en"
          helperText="Fecha en que el mantenimiento fue cerrado."
        >
          <FieldValue value={completedAtLabel} />
        </FieldCell>
      </div>

      {isEditing ? (
        <VisitDateSuggestions
          targetDate={form.target_date}
          suggestions={visitDateSuggestions}
          loading={loadingVisitDateSuggestions}
          message={visitDateSuggestionsMessage}
          error={visitDateSuggestionsError}
          locale={locale}
          onSelect={(value) => onChange("target_date", value)}
        />
      ) : null}

      <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 lg:grid-cols-[1.4fr_0.6fr]">
        <FieldCell
          label="Descripción"
          helperText="Motivo o detalle principal del mantenimiento."
        >
          {isEditing ? (
            <input
              type="text"
              value={form.reason}
              onChange={(e) => onChange("reason", e.target.value)}
              className={controlClassName}
              placeholder="Descripción del mantenimiento"
            />
          ) : (
            <FieldValue value={reasonLabel} />
          )}
        </FieldCell>

        <FieldCell
          label="Creado desde"
          helperText="Origen del registro dentro del sistema."
        >
          <FieldValue value={createdFrom} />
        </FieldCell>
      </div>
    </section>
  );
}

function VisitDateSuggestions({
  targetDate,
  suggestions,
  loading,
  message,
  error,
  locale,
  onSelect,
}: {
  targetDate: string;
  suggestions: OperationalZoneVisitDateSuggestion[];
  loading: boolean;
  message: string;
  error: string;
  locale: string;
  onSelect: (value: string) => void;
}) {
  if (loading) {
    return (
      <p className="text-xs leading-5 text-slate-500">
        Consultando fechas sugeridas para la zona...
      </p>
    );
  }

  if (suggestions.length > 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-700">
          Fechas sugeridas para la zona seleccionada
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => {
            const isSelected = targetDate === suggestion.visit_date;

            return (
              <button
                key={suggestion.operational_zone_visit_date_id}
                type="button"
                title={suggestion.reason}
                onClick={() => onSelect(suggestion.visit_date)}
                className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {formatSuggestedVisitDate(suggestion.visit_date, locale)}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          La fecha guardada se conserva hasta que seleccione otra. También puede
          escribir una fecha manualmente.
        </p>
      </div>
    );
  }

  if (message) {
    return <p className="text-xs leading-5 text-slate-500">{message}</p>;
  }

  if (error) {
    return (
      <p className="text-xs leading-5 text-amber-700">
        {error} Puede continuar usando la fecha actual o seleccionar otra
        manualmente.
      </p>
    );
  }

  return null;
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
      className={controlClassName}
    />
  );
}

function FieldCell({
  label,
  helperText,
  children,
}: {
  label: string;
  helperText: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <div className="mt-1.5">{children}</div>

      <p className="mt-1.5 text-xs leading-5 text-slate-500">{helperText}</p>
    </div>
  );
}

function FieldValue({ value }: { value: string }) {
  return (
    <p className="break-words text-sm font-medium leading-5 text-slate-800">
      {value || "-"}
    </p>
  );
}
