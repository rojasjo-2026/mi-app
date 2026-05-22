"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClientActivityLog } from "@/lib/clients/clientDetail.types";
import {
  formatActivityValue,
  formatDateTimeLabel,
  getActivityActionLabel,
  getActivityCategoryClass,
  getActivityCategoryLabel,
  getActivityFieldLabel,
} from "@/lib/clients/clientDetail.utils";
import { MiniInfoCard } from "@/components/clients/detail/MiniInfoCard";

type InstallationActivityHistorySectionProps = {
  clientId?: string | null;
  installationId: string;
};

function buildActivityUrl(clientId: string, installationId: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    entity_type: "INSTALLATION",
    entity_id: installationId,
    take: "50",
  });

  return `/api/activity-logs?${params.toString()}`;
}

export default function InstallationActivityHistorySection({
  clientId,
  installationId,
}: InstallationActivityHistorySectionProps) {
  const [activityLogs, setActivityLogs] = useState<ClientActivityLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInstallationHistory() {
      if (!clientId || !installationId) {
        setActivityLogs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          buildActivityUrl(clientId, installationId),
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "No se pudo cargar el historial de la instalación",
          );
        }

        setActivityLogs(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el historial de la instalación",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInstallationHistory();
  }, [clientId, installationId]);

  const categories = useMemo(
    () => [
      "ALL",
      ...Array.from(new Set(activityLogs.map((activity) => activity.category))),
    ],
    [activityLogs],
  );

  const filteredLogs = useMemo(
    () =>
      selectedCategory === "ALL"
        ? activityLogs
        : activityLogs.filter(
            (activity) => activity.category === selectedCategory,
          ),
    [activityLogs, selectedCategory],
  );

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Cargando historial de esta instalación...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Historial específico
          </p>

          <h2 className="text-lg font-semibold text-slate-900">
            Historial de esta instalación
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Muestra solo los eventos relacionados con esta instalación, sin
            mezclar otras instalaciones del mismo cliente.
          </p>
        </div>

        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
          {activityLogs.length === 1
            ? "1 evento"
            : `${activityLogs.length} eventos`}
        </span>
      </div>

      {activityLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Aún no hay eventos registrados para esta instalación.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Los cambios de estado, archivos, observaciones y componentes
            aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    category === selectedCategory
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {category === "ALL"
                    ? "Todos"
                    : getActivityCategoryLabel(category)}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Mostrando {filteredLogs.length} de {activityLogs.length} eventos
            </p>
          </div>

          <div className="space-y-3">
            {filteredLogs.map((activity) => (
              <div
                key={activity.activity_id}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getActivityCategoryClass(
                          activity.category,
                        )}`}
                      >
                        {getActivityCategoryLabel(activity.category)}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {getActivityActionLabel(activity.action)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {activity.title}
                    </p>

                    {activity.description && (
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {activity.description}
                      </p>
                    )}
                  </div>

                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {formatDateTimeLabel(activity.created_at)}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <MiniInfoCard
                    label="Módulo"
                    value={getActivityCategoryLabel(activity.category)}
                  />

                  <MiniInfoCard
                    label="Campo"
                    value={getActivityFieldLabel(activity.field_name)}
                  />

                  <MiniInfoCard
                    label="Usuario"
                    value={activity.created_by || "Sistema"}
                  />
                </div>

                {(activity.old_value || activity.new_value) && (
                  <details className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                      Ver cambios
                    </summary>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Antes
                        </p>
                        <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-800">
                          {formatActivityValue(
                            activity.old_value,
                            activity.field_name,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Después
                        </p>
                        <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-800">
                          {formatActivityValue(
                            activity.new_value,
                            activity.field_name,
                          )}
                        </p>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
