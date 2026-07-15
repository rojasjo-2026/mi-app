"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type PaginationData = {
  total: number;
  take: number;
  skip: number;
  page: number;
  totalPages: number;
};

type ActivityLogsResponse = {
  success: boolean;
  data: ActivityLog[];
  pagination?: PaginationData;
  message?: string;
};

type FollowUpContactHistorySectionProps = {
  clientId?: string;
  followUpId: string;
  formatDate: (value?: string | null) => string;
  formatDateTime: (value?: string | null) => string;
};

type PeriodFilter = "ALL" | "30" | "90" | "365";

const PAGE_SIZE = 6;

const categoryOptions = [
  { value: "", label: "Todas las categorías" },
  { value: "FOLLOW_UP", label: "Mantenimiento" },
  { value: "CONTACT", label: "Contacto" },
  { value: "FILE", label: "Archivo" },
  { value: "FINANCE", label: "Finanzas" },
  { value: "INSTALLATION", label: "Instalación" },
  { value: "CLIENT", label: "Cliente" },
  { value: "SYSTEM", label: "Sistema" },
];

const actionOptions = [
  { value: "", label: "Todas las acciones" },
  { value: "CREATED", label: "Creado" },
  { value: "UPDATED", label: "Actualizado" },
  { value: "STATUS_CHANGED", label: "Estado actualizado" },
  { value: "NOTE_ADDED", label: "Nota agregada" },
  { value: "FILE_ADDED", label: "Archivo agregado" },
  { value: "FILE_REMOVED", label: "Archivo removido" },
  { value: "CONTACT_REGISTERED", label: "Contacto registrado" },
  { value: "CONTACT_MESSAGE_SENT", label: "Mensaje enviado" },
  { value: "INVOICE_CREATED", label: "Factura creada" },
  { value: "INVOICE_UPDATED", label: "Factura actualizada" },
  { value: "PAYMENT_REGISTERED", label: "Pago registrado" },
  { value: "SYSTEM_EVENT", label: "Evento del sistema" },
  { value: "DELETED", label: "Eliminado" },
];

function getCategoryLabel(category: string) {
  return (
    categoryOptions.find((option) => option.value === category)?.label ??
    category
  );
}

function getActionLabel(action: string) {
  return (
    actionOptions.find((option) => option.value === action)?.label ?? action
  );
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

function getDateFromPeriod(period: PeriodFilter) {
  if (period === "ALL") return "";

  const date = new Date();
  date.setDate(date.getDate() - Number(period));

  return date.toISOString();
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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [action, setAction] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("ALL");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    take: PAGE_SIZE,
    skip: 0,
    page: 1,
    totalPages: 1,
  });

  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(
    null,
  );

  const hasActiveFilters = Boolean(
    searchInput.trim() || category || action || period !== "ALL",
  );

  const resultRange = useMemo(() => {
    if (pagination.total === 0) return "0 resultados";

    const start = pagination.skip + 1;
    const end = Math.min(pagination.skip + pagination.take, pagination.total);

    return `${start}-${end} de ${pagination.total}`;
  }, [pagination]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
      setSelectedActivity(null);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedActivity) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedActivity(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedActivity]);

  const loadActivityLogs = useCallback(
    async (showLoadingState = true) => {
      if (!clientId) {
        setError("No se pudo cargar el historial del mantenimiento.");
        setLoading(false);
        return;
      }

      try {
        if (showLoadingState) {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams({
          client_id: clientId,
          entity_type: "FOLLOW_UP",
          entity_id: followUpId,
          take: String(PAGE_SIZE),
          skip: String((page - 1) * PAGE_SIZE),
        });

        if (search) params.set("search", search);
        if (category) params.set("category", category);
        if (action) params.set("action", action);

        const dateFrom = getDateFromPeriod(period);
        if (dateFrom) params.set("date_from", dateFrom);

        const response = await fetch(
          `/api/activity-logs?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        const result: ActivityLogsResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "No se pudo cargar el historial.");
        }

        setActivityLogs(result.data ?? []);

        const nextPagination = result.pagination ?? {
          total: result.data?.length ?? 0,
          take: PAGE_SIZE,
          skip: (page - 1) * PAGE_SIZE,
          page,
          totalPages: 1,
        };

        setPagination(nextPagination);

        if (page > nextPagination.totalPages) {
          setPage(nextPagination.totalPages);
        }
      } catch {
        setError("No se pudo cargar el historial del mantenimiento.");
      } finally {
        if (showLoadingState) {
          setLoading(false);
        }
      }
    },
    [action, category, clientId, followUpId, page, period, search],
  );

  useEffect(() => {
    if (followUpId && clientId) {
      void loadActivityLogs();
      return;
    }

    setLoading(false);
  }, [clientId, followUpId, loadActivityLogs]);

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setAction("");
    setPeriod("ALL");
    setPage(1);
    setSelectedActivity(null);
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-950">
              Historial del mantenimiento
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Registro de cambios, acciones y eventos importantes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadActivityLogs(false)}
            disabled={loading}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Refrescar"}
          </button>
        </div>

        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(220px,1fr)_180px_190px_170px_auto]">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar en el historial..."
            className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
              setSelectedActivity(null);
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            {categoryOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
              setSelectedActivity(null);
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            {actionOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value as PeriodFilter);
              setPage(1);
              setSelectedActivity(null);
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="ALL">Cualquier fecha</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpiar
          </button>
        </div>

        {loading ? (
          <StateMessage>Cargando historial del mantenimiento...</StateMessage>
        ) : error ? (
          <StateMessage tone="error">{error}</StateMessage>
        ) : activityLogs.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
            <p className="text-sm font-medium text-slate-700">
              No se encontraron registros.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Ajustá los filtros o esperá a que se registren nuevas actividades.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {activityLogs.map((activity, index) => {
              const fieldLabel = formatFieldName(activity.field_name);

              return (
                <article
                  key={activity.activity_id}
                  className={[
                    "px-3 py-3",
                    index < activityLogs.length - 1
                      ? "border-b border-slate-200"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {activity.title}
                      </p>

                      {activity.description ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                          {activity.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getCategoryClasses(
                          activity.category,
                        )}`}
                      >
                        {getCategoryLabel(activity.category)}
                      </span>

                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {getActionLabel(activity.action)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedActivity(activity)}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-3">
                    <InfoCell
                      label="Fecha"
                      value={formatDateTime(activity.created_at)}
                    />

                    <InfoCell
                      label="Campo"
                      value={fieldLabel || "Evento general"}
                    />

                    <InfoCell
                      label="Usuario"
                      value={activity.created_by || "Sistema"}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500">{resultRange}</p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              <span className="min-w-[110px] text-center text-xs font-semibold text-slate-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
                disabled={page >= pagination.totalPages}
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {selectedActivity ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setSelectedActivity(null);
            }
          }}
        >
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Detalle del historial
                </p>

                <h3 className="mt-1 text-base font-semibold text-slate-950">
                  {selectedActivity.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </header>

            <div className="space-y-4 p-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getCategoryClasses(
                    selectedActivity.category,
                  )}`}
                >
                  {getCategoryLabel(selectedActivity.category)}
                </span>

                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {getActionLabel(selectedActivity.action)}
                </span>
              </div>

              {selectedActivity.description ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selectedActivity.description}
                </p>
              ) : null}

              <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-3">
                <InfoCell
                  label="Fecha"
                  value={formatDateTime(selectedActivity.created_at)}
                />

                <InfoCell
                  label="Campo"
                  value={
                    formatFieldName(selectedActivity.field_name) ||
                    "Evento general"
                  }
                />

                <InfoCell
                  label="Usuario"
                  value={selectedActivity.created_by || "Sistema"}
                />
              </div>

              {selectedActivity.old_value || selectedActivity.new_value ? (
                <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-2">
                  <InfoCell
                    label="Antes"
                    value={formatValue(selectedActivity.old_value, formatDate)}
                  />

                  <InfoCell
                    label="Después"
                    value={formatValue(selectedActivity.new_value, formatDate)}
                  />
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  Este evento no contiene valores anteriores o posteriores.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function StateMessage({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) {
  const className =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-500";

  return (
    <div className={`rounded-md border px-4 py-5 text-sm ${className}`}>
      {children}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}
