"use client";

import { useEffect, useState } from "react";

type ActivityLog = {
  activity_id: string;
  client_id: string;
  entity_type: string;
  entity_id: string;
  category: string;
  action: string;
  visibility: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  title: string;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
};

type ActivityLogsResponse = {
  success: boolean;
  data: ActivityLog[];
  message?: string;
};

type FollowUpContactHistorySectionProps = {
  clientId?: string;
  followUpId: string;
  formatDate: (value?: string | null) => string;
  formatDateTime: (value?: string | null) => string;
};

function getCategoryLabel(category: string) {
  switch (category) {
    case "FOLLOW_UP":
      return "Mantenimiento";
    case "CLIENT":
      return "Cliente";
    case "INSTALLATION":
      return "Instalación";
    case "CONTACT":
      return "Contacto";
    case "FILE":
      return "Archivo";
    case "FINANCE":
      return "Finanzas";
    case "SYSTEM":
      return "Sistema";
    default:
      return category;
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case "CREATED":
      return "Creado";
    case "UPDATED":
      return "Actualizado";
    case "DELETED":
      return "Eliminado";
    case "STATUS_CHANGED":
      return "Estado actualizado";
    case "NOTE_ADDED":
      return "Nota agregada";
    case "FILE_ADDED":
      return "Archivo agregado";
    case "FILE_REMOVED":
      return "Archivo removido";
    case "CONTACT_REGISTERED":
      return "Contacto registrado";
    case "CONTACT_MESSAGE_SENT":
      return "Mensaje enviado";
    case "INVOICE_CREATED":
      return "Factura creada";
    case "INVOICE_UPDATED":
      return "Factura actualizada";
    case "PAYMENT_REGISTERED":
      return "Pago registrado";
    case "SYSTEM_EVENT":
      return "Evento del sistema";
    default:
      return action;
  }
}

function getCategoryClasses(category: string) {
  switch (category) {
    case "FOLLOW_UP":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CONTACT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INSTALLATION":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "FILE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "FINANCE":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatFieldName(fieldName?: string | null) {
  if (!fieldName) return null;

  const labels: Record<string, string> = {
    target_date: "Fecha objetivo",
    due_date: "Fecha límite",
    scheduled_date: "Fecha programada",
    completed_at: "Fecha de finalización",
    reason: "Descripción",
    priority: "Prioridad",
    notes: "Notas",
    maintenance_type: "Tipo de mantenimiento",
    technician_id: "Técnico asignado",
    follow_up_status_id: "Estado",
    estimated_amount: "Monto estimado",
    final_amount: "Monto final",
    cost_amount: "Costo",
    billing_status: "Estado de facturación",
    billing_notes: "Notas de facturación",
    billing_block_reason: "Motivo de bloqueo de facturación",
  };

  return labels[fieldName] ?? fieldName;
}

function formatValue(
  value?: string | null,
  formatDate?: (value?: string | null) => string,
) {
  if (!value) return "—";

  const parsedDate = new Date(value);

  if (
    formatDate &&
    !Number.isNaN(parsedDate.getTime()) &&
    value.includes("T")
  ) {
    return formatDate(value);
  }

  return value;
}

export default function FollowUpContactHistorySection({
  clientId,
  followUpId,
  formatDate,
  formatDateTime,
}: FollowUpContactHistorySectionProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadActivityLogs() {
    if (!clientId) {
      setError("No se pudo cargar el historial del mantenimiento.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/activity-logs?client_id=${clientId}&entity_type=FOLLOW_UP&entity_id=${followUpId}&take=50`,
        { cache: "no-store" },
      );

      const result: ActivityLogsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el historial.");
      }

      setActivityLogs(result.data ?? []);
    } catch {
      setError("No se pudo cargar el historial del mantenimiento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (followUpId && clientId) {
      void loadActivityLogs();
      return;
    }

    setLoading(false);
  }, [followUpId, clientId]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Historial del mantenimiento
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Registro de cambios, acciones y eventos importantes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadActivityLogs()}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refrescar
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-500">
            Cargando historial del mantenimiento...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : activityLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-medium text-slate-700">
            Aún no hay cambios registrados para este mantenimiento.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Cuando se modifique información del mantenimiento, los cambios se
            mostrarán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activityLogs.map((activity) => {
            const fieldLabel = formatFieldName(activity.field_name);

            return (
              <div
                key={activity.activity_id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {activity.title}
                    </p>

                    {activity.description && (
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {activity.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryClasses(
                        activity.category,
                      )}`}
                    >
                      {getCategoryLabel(activity.category)}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {getActionLabel(activity.action)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Fecha
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formatDateTime(activity.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Campo
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {fieldLabel || "Evento general"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Usuario
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {activity.created_by || "Sistema"}
                    </p>
                  </div>
                </div>

                {(activity.old_value || activity.new_value) && (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Antes
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-700">
                        {formatValue(activity.old_value, formatDate)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Después
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-700">
                        {formatValue(activity.new_value, formatDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
