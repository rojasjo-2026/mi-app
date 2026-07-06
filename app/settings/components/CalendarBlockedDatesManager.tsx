"use client";

import { useEffect, useState } from "react";
import { resolveAppSettings } from "@/lib/config/app-settings";

type BlockedDate = {
  id: string;
  date: string;
  type: "blocked";
  title: string;
  description: string;
};

type CalendarBlockedApiResponse = {
  success: boolean;
  data?: BlockedDate[] | BlockedDate | { id: string };
  message?: string;
};

type CalendarBlockedDatesManagerProps = {
  locale?: string | null;
};

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

export default function CalendarBlockedDatesManager({
  locale,
}: CalendarBlockedDatesManagerProps) {
  const resolvedSettings = resolveAppSettings();
  const displayLocale = locale || resolvedSettings.locale;

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockedDate, setBlockedDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadBlockedDates() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/calendar-blocked", {
        cache: "no-store",
      });

      const result: CalendarBlockedApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar las fechas bloqueadas.",
        );
      }

      setBlockedDates(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar las fechas bloqueadas.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBlockedDate() {
    if (!blockedDate) {
      setError("Debe seleccionar una fecha para bloquear.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/calendar-blocked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blocked_date: blockedDate,
          reason: reason.trim(),
        }),
      });

      const result: CalendarBlockedApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo bloquear la fecha.");
      }

      setBlockedDate("");
      setReason("");

      setSuccessMessage(
        result.message === "Date already blocked"
          ? "La fecha ya estaba bloqueada."
          : "Fecha bloqueada correctamente.",
      );

      await loadBlockedDates();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al bloquear la fecha.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBlockedDate(id: string) {
    const confirmed = window.confirm(
      "¿Seguro que desea desbloquear esta fecha?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/calendar-blocked", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result: CalendarBlockedApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo desbloquear la fecha.");
      }

      setSuccessMessage("Fecha desbloqueada correctamente.");
      await loadBlockedDates();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al desbloquear la fecha.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void loadBlockedDates();
  }, []);

  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900">
          Bloqueos de calendario
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Administre fechas que no estarán disponibles para instalaciones,
          mantenimientos o visitas técnicas.
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

      <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto]">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Fecha</span>

          <input
            type="date"
            value={blockedDate}
            onChange={(event) => setBlockedDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Motivo</span>

          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ej. Feriado, capacitación, vacaciones, vehículo no disponible..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void handleCreateBlockedDate()}
            disabled={saving}
            className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Bloquear fecha"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-800">
          Fechas bloqueadas
        </p>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
            Cargando fechas bloqueadas...
          </div>
        ) : blockedDates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
            No hay fechas bloqueadas registradas.
          </div>
        ) : (
          <div className="space-y-2">
            {blockedDates.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold capitalize text-slate-900">
                    {formatDisplayDate(item.date, displayLocale)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.description || "No disponible para agendar."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDeleteBlockedDate(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === item.id ? "Procesando..." : "Desbloquear"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        Estos bloqueos se reflejan en el calendario y más adelante serán usados
        por el motor de disponibilidad para evitar sugerir fechas no
        disponibles.
      </div>
    </div>
  );
}
