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
import Card from "./Card";

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
      <Card title="Historial de actividad">
        <p className="text-sm text-slate-500">
          Cargando historial de esta instalación...
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 px-6 py-6 shadow-sm">
        <p className="text-sm font-medium leading-6 text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <Card title="Historial de actividad">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            Eventos relacionados únicamente con esta instalación, sin mezclar la
            actividad de otras instalaciones del cliente.
          </p>

          <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
            {activityLogs.length === 1
              ? "1 evento"
              : `${activityLogs.length} eventos`}
          </span>
        </div>

        {activityLogs.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              Aún no hay eventos registrados para esta instalación.
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Los cambios de estado, archivos, observaciones y componentes
              aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-semibold transition ${
                      category === selectedCategory
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {category === "ALL"
                      ? "Todos"
                      : getActivityCategoryLabel(category)}
                  </button>
                ))}
              </div>

              <p className="shrink-0 text-xs text-slate-500">
                Mostrando {filteredLogs.length} de {activityLogs.length} eventos
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredLogs.map((activity) => (
                <article
                  key={activity.activity_id}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getActivityCategoryClass(
                            activity.category,
                          )}`}
                        >
                          {getActivityCategoryLabel(activity.category)}
                        </span>

                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                          {getActivityActionLabel(activity.action)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-950">
                        {activity.title}
                      </p>

                      {activity.description ? (
                        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
                          {activity.description}
                        </p>
                      ) : null}
                    </div>

                    <p className="shrink-0 text-xs font-medium leading-5 text-slate-500 lg:text-right">
                      {formatDateTimeLabel(activity.created_at)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Módulo
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
                        {getActivityCategoryLabel(activity.category)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Campo
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
                        {getActivityFieldLabel(activity.field_name)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Usuario
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
                        {activity.created_by || "Sistema"}
                      </p>
                    </div>
                  </div>

                  {activity.old_value || activity.new_value ? (
                    <details className="mt-4 border-t border-slate-100 pt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                        Ver cambios
                      </summary>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Antes
                          </p>

                          <div className="mt-1 rounded-md border border-red-100 bg-red-50 px-3 py-2">
                            <p className="break-words text-sm font-medium leading-6 text-red-700">
                              {formatActivityValue(
                                activity.old_value,
                                activity.field_name,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Después
                          </p>

                          <div className="mt-1 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
                            <p className="break-words text-sm font-medium leading-6 text-emerald-700">
                              {formatActivityValue(
                                activity.new_value,
                                activity.field_name,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </details>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
