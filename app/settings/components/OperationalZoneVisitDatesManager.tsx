"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type OperationalZoneVisitDate = {
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
  visit_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type OperationalZoneVisitDatesApiResponse = {
  success: boolean;
  data?: OperationalZoneVisitDate[] | OperationalZoneVisitDate;
  message?: string;
};

type OperationalZoneVisitDatesManagerProps = {
  operationalZoneId: string;
  operationalZoneName: string;
};

function formatVisitDate(value: string) {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
}

export default function OperationalZoneVisitDatesManager({
  operationalZoneId,
  operationalZoneName,
}: OperationalZoneVisitDatesManagerProps) {
  const [visitDates, setVisitDates] = useState<OperationalZoneVisitDate[]>([]);
  const [newVisitDate, setNewVisitDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeVisitDates = useMemo(
    () => visitDates.filter((visitDate) => visitDate.is_active),
    [visitDates],
  );

  const inactiveVisitDates = useMemo(
    () => visitDates.filter((visitDate) => !visitDate.is_active),
    [visitDates],
  );

  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  const loadVisitDates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/operational-zones/${encodeURIComponent(
          operationalZoneId,
        )}/visit-dates`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result: OperationalZoneVisitDatesApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar las fechas de visita.",
        );
      }

      setVisitDates(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar las fechas de visita.",
      );
    } finally {
      setLoading(false);
    }
  }, [operationalZoneId]);

  async function handleCreateVisitDate() {
    if (!newVisitDate) {
      setError("Debe seleccionar una fecha de visita.");
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      const response = await fetch(
        `/api/operational-zones/${encodeURIComponent(
          operationalZoneId,
        )}/visit-dates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visit_date: newVisitDate,
          }),
        },
      );

      const result: OperationalZoneVisitDatesApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo crear la fecha de visita.",
        );
      }

      setNewVisitDate("");
      setSuccessMessage("Fecha de visita creada correctamente.");
      await loadVisitDates();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear la fecha de visita.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVisitDate(visitDate: OperationalZoneVisitDate) {
    try {
      setProcessingId(visitDate.operational_zone_visit_date_id);
      clearMessages();

      const response = await fetch(
        `/api/operational-zones/${encodeURIComponent(
          operationalZoneId,
        )}/visit-dates/${encodeURIComponent(
          visitDate.operational_zone_visit_date_id,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: visitDate.is_active ? "deactivate" : "activate",
          }),
        },
      );

      const result: OperationalZoneVisitDatesApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo cambiar el estado de la fecha de visita.",
        );
      }

      setSuccessMessage(
        visitDate.is_active
          ? "Fecha de visita desactivada correctamente."
          : "Fecha de visita activada correctamente.",
      );

      await loadVisitDates();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cambiar el estado de la fecha de visita.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeleteVisitDate(visitDate: OperationalZoneVisitDate) {
    const confirmed = window.confirm(
      `¿Desea eliminar la fecha ${formatVisitDate(
        visitDate.visit_date,
      )} de ${operationalZoneName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(visitDate.operational_zone_visit_date_id);
      clearMessages();

      const response = await fetch(
        `/api/operational-zones/${encodeURIComponent(
          operationalZoneId,
        )}/visit-dates/${encodeURIComponent(
          visitDate.operational_zone_visit_date_id,
        )}`,
        {
          method: "DELETE",
        },
      );

      const result: OperationalZoneVisitDatesApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo eliminar la fecha de visita.",
        );
      }

      setSuccessMessage("Fecha de visita eliminada correctamente.");
      await loadVisitDates();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar la fecha de visita.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  useEffect(() => {
    setNewVisitDate("");
    setSuccessMessage("");
    void loadVisitDates();
  }, [loadVisitDates]);

  function renderVisitDate(visitDate: OperationalZoneVisitDate) {
    const isProcessing =
      processingId === visitDate.operational_zone_visit_date_id;

    return (
      <div
        key={visitDate.operational_zone_visit_date_id}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {formatVisitDate(visitDate.visit_date)}
            </p>

            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                visitDate.is_active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              {visitDate.is_active ? "Activa" : "Inactiva"}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Fecha programada: {visitDate.visit_date}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleToggleVisitDate(visitDate)}
            disabled={isProcessing}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing
              ? "Procesando..."
              : visitDate.is_active
                ? "Desactivar"
                : "Activar"}
          </button>

          <button
            type="button"
            onClick={() => void handleDeleteVisitDate(visitDate)}
            disabled={isProcessing}
            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Fechas de visita
        </h4>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Programe los días en los que la empresa tiene previsto visitar{" "}
          <span className="font-semibold text-slate-700">
            {operationalZoneName}
          </span>
          .
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Nueva fecha de visita
          </span>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="date"
              value={newVisitDate}
              onChange={(event) => {
                setNewVisitDate(event.target.value);
                clearMessages();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
            />

            <button
              type="button"
              onClick={() => void handleCreateVisitDate()}
              disabled={saving}
              className="h-9 shrink-0 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Agregar fecha"}
            </button>
          </div>
        </label>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-slate-800">
          Fechas activas
        </p>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
            Cargando fechas de visita...
          </div>
        ) : activeVisitDates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
            No hay fechas de visita activas para esta zona.
          </div>
        ) : (
          <div className="space-y-2">
            {activeVisitDates.map(renderVisitDate)}
          </div>
        )}
      </div>

      {inactiveVisitDates.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Fechas inactivas
          </p>

          <div className="space-y-2">
            {inactiveVisitDates.map(renderVisitDate)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
