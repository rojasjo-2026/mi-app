"use client";

import { useEffect, useMemo, useState } from "react";

type BusinessWeekDayValue =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type BusinessWorkingHour = {
  id: string;
  day_of_week: BusinessWeekDayValue;
  country_code: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type BusinessWorkingHoursApiResponse = {
  success: boolean;
  data?: BusinessWorkingHour[] | BusinessWorkingHour | { id: string };
  message?: string;
};

type WorkingHourForm = {
  day_of_week: BusinessWeekDayValue | "";
  country_code: string;
  is_working_day: boolean;
  start_time: string;
  end_time: string;
  break_start_time: string;
  break_end_time: string;
  notes: string;
};

type BusinessWorkingHoursManagerProps = {
  countryCode: string;
  countryName: string;
};

const weekDayLabels: Record<BusinessWeekDayValue, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

const weekDays = Object.keys(weekDayLabels) as BusinessWeekDayValue[];

function normalizeCountryCode(value: string) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function buildEmptyForm(countryCode: string): WorkingHourForm {
  return {
    day_of_week: "",
    country_code: normalizeCountryCode(countryCode),
    is_working_day: false,
    start_time: "",
    end_time: "",
    break_start_time: "",
    break_end_time: "",
    notes: "",
  };
}

function formatWorkingHour(item: BusinessWorkingHour) {
  if (!item.is_working_day) {
    return "Día cerrado / no laboral";
  }

  const mainRange =
    item.start_time && item.end_time
      ? `${item.start_time} - ${item.end_time}`
      : "Horario incompleto";

  const breakRange =
    item.break_start_time && item.break_end_time
      ? ` · Almuerzo: ${item.break_start_time} - ${item.break_end_time}`
      : "";

  return `${mainRange}${breakRange}`;
}

function buildFormFromItem(item: BusinessWorkingHour): WorkingHourForm {
  return {
    day_of_week: item.day_of_week,
    country_code: item.country_code,
    is_working_day: item.is_working_day,
    start_time: item.start_time || "",
    end_time: item.end_time || "",
    break_start_time: item.break_start_time || "",
    break_end_time: item.break_end_time || "",
    notes: item.notes || "",
  };
}

function validateForm(form: WorkingHourForm) {
  if (!form.day_of_week) {
    return "Debe seleccionar un día de la semana.";
  }

  if (form.is_working_day && (!form.start_time || !form.end_time)) {
    return "Debe ingresar hora de inicio y hora de cierre para días laborales.";
  }

  const hasBreakStart = Boolean(form.break_start_time);
  const hasBreakEnd = Boolean(form.break_end_time);

  if (hasBreakStart !== hasBreakEnd) {
    return "La hora de inicio y fin del almuerzo deben ingresarse juntas.";
  }

  return "";
}

export default function BusinessWorkingHoursManager({
  countryCode,
  countryName,
}: BusinessWorkingHoursManagerProps) {
  const operationalCountryCode = normalizeCountryCode(countryCode);
  const operationalCountryName = countryName || operationalCountryCode;

  const [workingHours, setWorkingHours] = useState<BusinessWorkingHour[]>([]);
  const [form, setForm] = useState<WorkingHourForm>(() =>
    buildEmptyForm(operationalCountryCode),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<WorkingHourForm>(() =>
    buildEmptyForm(operationalCountryCode),
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeWorkingHours = useMemo(
    () => workingHours.filter((item) => item.is_active),
    [workingHours],
  );

  const inactiveWorkingHours = useMemo(
    () => workingHours.filter((item) => !item.is_active),
    [workingHours],
  );

  async function loadWorkingHours() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/business-working-hours?country_code=${encodeURIComponent(
          operationalCountryCode,
        )}`,
        {
          cache: "no-store",
        },
      );

      const result: BusinessWorkingHoursApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo cargar el horario laboral.",
        );
      }

      setWorkingHours(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar el horario laboral.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWorkingHour() {
    const validationMessage = validateForm(form);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/business-working-hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          day_of_week: form.day_of_week,
          country_code: operationalCountryCode,
          is_working_day: form.is_working_day,
          start_time: form.is_working_day ? form.start_time : "",
          end_time: form.is_working_day ? form.end_time : "",
          break_start_time: form.is_working_day ? form.break_start_time : "",
          break_end_time: form.is_working_day ? form.break_end_time : "",
          notes: form.notes.trim(),
        }),
      });

      const result: BusinessWorkingHoursApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo crear el horario laboral.",
        );
      }

      setForm(buildEmptyForm(operationalCountryCode));
      setSuccessMessage("Horario laboral creado correctamente.");
      await loadWorkingHours();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el horario laboral.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(item: BusinessWorkingHour) {
    setEditingId(item.id);
    setEditingForm(buildFormFromItem(item));
    setError("");
    setSuccessMessage("");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingForm(buildEmptyForm(operationalCountryCode));
    setError("");
  }

  async function handleUpdateWorkingHour(id: string) {
    const validationMessage = validateForm(editingForm);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setUpdatingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/business-working-hours", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          day_of_week: editingForm.day_of_week,
          country_code: operationalCountryCode,
          is_working_day: editingForm.is_working_day,
          start_time: editingForm.is_working_day ? editingForm.start_time : "",
          end_time: editingForm.is_working_day ? editingForm.end_time : "",
          break_start_time: editingForm.is_working_day
            ? editingForm.break_start_time
            : "",
          break_end_time: editingForm.is_working_day
            ? editingForm.break_end_time
            : "",
          notes: editingForm.notes.trim(),
        }),
      });

      const result: BusinessWorkingHoursApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo actualizar el horario laboral.",
        );
      }

      setEditingId(null);
      setEditingForm(buildEmptyForm(operationalCountryCode));
      setSuccessMessage("Horario laboral actualizado correctamente.");
      await loadWorkingHours();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar el horario laboral.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleActive(item: BusinessWorkingHour) {
    try {
      setUpdatingId(item.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/business-working-hours", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          is_active: !item.is_active,
        }),
      });

      const result: BusinessWorkingHoursApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo cambiar el estado del horario.",
        );
      }

      setSuccessMessage(
        item.is_active
          ? "Horario laboral desactivado correctamente."
          : "Horario laboral activado correctamente.",
      );

      await loadWorkingHours();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cambiar el estado del horario.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteWorkingHour(id: string) {
    const confirmed = window.confirm(
      "¿Seguro que desea eliminar esta configuración de horario laboral?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/business-working-hours", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result: BusinessWorkingHoursApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo eliminar el horario laboral.",
        );
      }

      setSuccessMessage("Horario laboral eliminado correctamente.");
      await loadWorkingHours();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar el horario laboral.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    setForm(buildEmptyForm(operationalCountryCode));
    setEditingId(null);
    setEditingForm(buildEmptyForm(operationalCountryCode));
    void loadWorkingHours();
  }, [operationalCountryCode]);

  function renderFormFields(
    currentForm: WorkingHourForm,
    onChange: (nextForm: WorkingHourForm) => void,
    isEditing = false,
  ) {
    return (
      <div className="grid gap-4 lg:grid-cols-[180px_180px_160px_1fr]">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Día</span>

          <select
            value={currentForm.day_of_week}
            onChange={(event) =>
              onChange({
                ...currentForm,
                day_of_week: event.target.value as BusinessWeekDayValue | "",
              })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          >
            <option value="">Seleccione...</option>
            {weekDays.map((day) => (
              <option key={day} value={day}>
                {weekDayLabels[day]}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            País operativo
          </span>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {operationalCountryName} ({operationalCountryCode})
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:mt-7">
          <input
            type="checkbox"
            checked={currentForm.is_working_day}
            onChange={(event) =>
              onChange({
                ...currentForm,
                is_working_day: event.target.checked,
              })
            }
            className="h-4 w-4 rounded border-slate-300"
          />

          <span className="text-sm font-semibold text-slate-700">
            Día laboral
          </span>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Notas</span>

          <input
            value={currentForm.notes}
            onChange={(event) =>
              onChange({
                ...currentForm,
                notes: event.target.value,
              })
            }
            placeholder={
              isEditing
                ? "Notas del horario..."
                : "Ej. Horario especial, atención limitada..."
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        {currentForm.is_working_day ? (
          <>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Hora inicio
              </span>

              <input
                type="time"
                value={currentForm.start_time}
                onChange={(event) =>
                  onChange({
                    ...currentForm,
                    start_time: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Hora cierre
              </span>

              <input
                type="time"
                value={currentForm.end_time}
                onChange={(event) =>
                  onChange({
                    ...currentForm,
                    end_time: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Inicio almuerzo
              </span>

              <input
                type="time"
                value={currentForm.break_start_time}
                onChange={(event) =>
                  onChange({
                    ...currentForm,
                    break_start_time: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Fin almuerzo
              </span>

              <input
                type="time"
                value={currentForm.break_end_time}
                onChange={(event) =>
                  onChange({
                    ...currentForm,
                    break_end_time: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
          </>
        ) : null}
      </div>
    );
  }

  function renderWorkingHourCard(item: BusinessWorkingHour) {
    const isEditingThisItem = editingId === item.id;

    return (
      <div
        key={item.id}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
      >
        {isEditingThisItem ? (
          <div className="space-y-4">
            {renderFormFields(editingForm, setEditingForm, true)}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleUpdateWorkingHour(item.id)}
                disabled={updatingId === item.id}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === item.id ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={updatingId === item.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {weekDayLabels[item.day_of_week]}
                </p>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {item.country_code}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    item.is_working_day
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.is_working_day ? "Laboral" : "Cerrado"}
                </span>

                {!item.is_active ? (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    Inactivo
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm font-medium text-slate-700">
                {formatWorkingHour(item)}
              </p>

              {item.notes ? (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {item.notes}
                </p>
              ) : (
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Sin notas adicionales.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => handleStartEdit(item)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => void handleToggleActive(item)}
                disabled={updatingId === item.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === item.id
                  ? "Procesando..."
                  : item.is_active
                    ? "Desactivar"
                    : "Activar"}
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteWorkingHour(item.id)}
                disabled={deletingId === item.id}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === item.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900">Horario laboral</h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Configure manualmente los días y horas de trabajo de la empresa. El
          sistema no asume horarios por defecto.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <p className="mb-4 text-sm font-semibold text-slate-800">
          Agregar configuración de horario
        </p>

        {renderFormFields(form, setForm)}

        <button
          type="button"
          onClick={() => void handleCreateWorkingHour()}
          disabled={saving}
          className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Crear horario laboral"}
        </button>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-800">
          Horarios activos
        </p>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
            Cargando horario laboral...
          </div>
        ) : activeWorkingHours.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
            No hay horario laboral configurado para {operationalCountryName} (
            {operationalCountryCode}). El usuario debe definirlo manualmente.
          </div>
        ) : (
          <div className="space-y-2">
            {activeWorkingHours.map(renderWorkingHourCard)}
          </div>
        )}
      </div>

      {inactiveWorkingHours.length > 0 ? (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Horarios inactivos
          </p>

          <div className="space-y-2">
            {inactiveWorkingHours.map(renderWorkingHourCard)}
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        Este horario será usado más adelante por el motor de disponibilidad para
        sugerir fechas válidas. Por ahora queda registrado como configuración
        operativa.
      </div>
    </div>
  );
}
