"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveAppSettings } from "@/lib/config/app-settings";

type NonWorkingDayType =
  | "HOLIDAY"
  | "INTERNAL_CLOSURE"
  | "COLLECTIVE_VACATION"
  | "SPECIAL_EVENT"
  | "OTHER";

type CalendarNonWorkingDay = {
  id: string;
  date: string;
  type: "non_working";
  title: string;
  description: string | null;
  non_working_day_type: NonWorkingDayType;
  country_code: string;
  is_recurring_yearly: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CalendarNonWorkingDaysApiResponse = {
  success: boolean;
  data?: CalendarNonWorkingDay[] | CalendarNonWorkingDay | { id: string };
  message?: string;
};

type CalendarNonWorkingDaysManagerProps = {
  locale?: string | null;
  countryCode?: string | null;
};

const nonWorkingDayTypeLabels: Record<NonWorkingDayType, string> = {
  HOLIDAY: "Feriado",
  INTERNAL_CLOSURE: "Cierre interno",
  COLLECTIVE_VACATION: "Vacaciones colectivas",
  SPECIAL_EVENT: "Evento especial",
  OTHER: "Otro",
};

const nonWorkingDayTypes = Object.keys(
  nonWorkingDayTypeLabels,
) as NonWorkingDayType[];

function formatDisplayDate(dateValue: string, locale?: string | null) {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return dateValue;
  }

  return new Date(year, month - 1, day).toLocaleDateString(
    locale || undefined,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

export default function CalendarNonWorkingDaysManager({
  locale,
  countryCode: businessCountryCode,
}: CalendarNonWorkingDaysManagerProps) {
  const defaultSettings = useMemo(() => resolveAppSettings(), []);

  const displayLocale = locale || defaultSettings.locale;
  const defaultCountryCode = (
    businessCountryCode || defaultSettings.countryCode
  ).toUpperCase();

  const [nonWorkingDays, setNonWorkingDays] = useState<CalendarNonWorkingDay[]>(
    [],
  );

  const [nonWorkingDate, setNonWorkingDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<NonWorkingDayType>("HOLIDAY");
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [isRecurringYearly, setIsRecurringYearly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeDays = useMemo(
    () => nonWorkingDays.filter((item) => item.is_active),
    [nonWorkingDays],
  );

  const inactiveDays = useMemo(
    () => nonWorkingDays.filter((item) => !item.is_active),
    [nonWorkingDays],
  );

  async function loadNonWorkingDays() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/calendar-non-working-days", {
        cache: "no-store",
      });

      const result: CalendarNonWorkingDaysApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar los días no laborables.",
        );
      }

      setNonWorkingDays(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar los días no laborables.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNonWorkingDay() {
    if (!nonWorkingDate) {
      setError("Debe seleccionar una fecha.");
      return;
    }

    if (!title.trim()) {
      setError("Debe ingresar un título para el día no laborable.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/calendar-non-working-days", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          non_working_date: nonWorkingDate,
          title: title.trim(),
          description: description.trim(),
          type,
          country_code: countryCode.trim().toUpperCase() || defaultCountryCode,
          is_recurring_yearly: isRecurringYearly,
        }),
      });

      const result: CalendarNonWorkingDaysApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo crear el día no laborable.",
        );
      }

      setNonWorkingDate("");
      setTitle("");
      setDescription("");
      setType("HOLIDAY");
      setCountryCode(defaultCountryCode);
      setIsRecurringYearly(false);

      setSuccessMessage("Día no laborable creado correctamente.");
      await loadNonWorkingDays();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el día no laborable.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: CalendarNonWorkingDay) {
    try {
      setUpdatingId(item.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/calendar-non-working-days", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          is_active: !item.is_active,
        }),
      });

      const result: CalendarNonWorkingDaysApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo actualizar el día no laborable.",
        );
      }

      setSuccessMessage(
        item.is_active
          ? "Día no laborable desactivado correctamente."
          : "Día no laborable activado correctamente.",
      );

      await loadNonWorkingDays();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar el día no laborable.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteNonWorkingDay(id: string) {
    const confirmed = window.confirm(
      "¿Seguro que desea eliminar este día no laborable?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/calendar-non-working-days", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result: CalendarNonWorkingDaysApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo eliminar el día no laborable.",
        );
      }

      setSuccessMessage("Día no laborable eliminado correctamente.");
      await loadNonWorkingDays();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar el día no laborable.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void loadNonWorkingDays();
  }, []);

  useEffect(() => {
    setCountryCode(defaultCountryCode);
  }, [defaultCountryCode]);

  function renderDayCard(item: CalendarNonWorkingDay) {
    return (
      <div
        key={item.id}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold capitalize text-slate-900">
              {formatDisplayDate(item.date, displayLocale)}
            </p>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {item.country_code}
            </span>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              {nonWorkingDayTypeLabels[item.non_working_day_type]}
            </span>

            {item.is_recurring_yearly ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                Recurrente anual
              </span>
            ) : null}

            {!item.is_active ? (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                Inactivo
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-800">
            {item.title}
          </p>

          {item.description ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {item.description}
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Sin descripción adicional.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
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
            onClick={() => void handleDeleteNonWorkingDay(item.id)}
            disabled={deletingId === item.id}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingId === item.id ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900">
          Días no laborables
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Administre feriados, cierres internos, vacaciones colectivas o días
          donde la empresa no debería agendar instalaciones ni mantenimientos.
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

      <div className="grid gap-4 lg:grid-cols-[180px_1fr_180px]">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Fecha</span>

          <input
            type="date"
            value={nonWorkingDate}
            onChange={(event) => setNonWorkingDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Título</span>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Navidad, Día feriado, Cierre por actividad interna..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">País</span>

          <input
            value={countryCode}
            onChange={(event) =>
              setCountryCode(event.target.value.toUpperCase())
            }
            maxLength={3}
            placeholder={defaultCountryCode}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Tipo</span>

          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as NonWorkingDayType)
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          >
            {nonWorkingDayTypes.map((item) => (
              <option key={item} value={item}>
                {nonWorkingDayTypeLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Descripción
          </span>

          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej. Feriado nacional, cierre general de la empresa, vacaciones colectivas..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <input
            type="checkbox"
            checked={isRecurringYearly}
            onChange={(event) => setIsRecurringYearly(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />

          <span className="text-sm font-semibold text-slate-700">
            Recurrente anual
          </span>
        </label>

        <div className="flex items-end lg:col-span-2">
          <button
            type="button"
            onClick={() => void handleCreateNonWorkingDay()}
            disabled={saving}
            className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Crear día no laborable"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-800">
          Días no laborables activos
        </p>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
            Cargando días no laborables...
          </div>
        ) : activeDays.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
            No hay días no laborables activos registrados.
          </div>
        ) : (
          <div className="space-y-2">{activeDays.map(renderDayCard)}</div>
        )}
      </div>

      {inactiveDays.length > 0 ? (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Días no laborables inactivos
          </p>

          <div className="space-y-2">{inactiveDays.map(renderDayCard)}</div>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        Estos días serán usados más adelante por el motor de disponibilidad para
        evitar sugerir fechas donde la empresa no trabaja. Por ahora quedan
        registrados como configuración operativa.
      </div>
    </div>
  );
}
