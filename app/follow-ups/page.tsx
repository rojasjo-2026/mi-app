"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FollowUp = {
  follow_up_id: string;
  target_date: string;
  reason: string | null;
  priority: number | null;
  follow_up_status?: {
    code: string;
    name: string;
  };
  client?: {
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
  } | null;
  installation?: {
    description?: string | null;
    installation_date?: string | null;
  } | null;
};

type FollowUpFilter = "all" | "pending" | "completed" | "postponed";

function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

function getStatusClasses(status?: string) {
  if (status === "completed") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "postponed") {
    return "border border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border border-blue-200 bg-blue-50 text-blue-700";
}

function getPriorityClasses(priority?: number | null) {
  if (priority === 1) {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (priority === 2) {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === 3) {
    return "border border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-600";
}

function formatDateLabel(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTimingMeta(targetDate: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const parsed = new Date(targetDate);
  const target = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );

  if (target.getTime() < today.getTime()) {
    return {
      label: "Atrasado",
      classes: "border border-red-200 bg-red-50 text-red-700",
    };
  }

  if (target.getTime() === today.getTime()) {
    return {
      label: "Hoy",
      classes: "border border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Próximo",
    classes: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getClientName(client?: FollowUp["client"]) {
  const composedName = [
    client?.first_name,
    client?.last_name_1,
    client?.last_name_2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || "Cliente sin nombre";
}

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FollowUpFilter>("all");

  useEffect(() => {
    async function loadFollowUps() {
      try {
        const res = await fetch("/api/follow-ups", {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error("Failed to load follow ups");
        }

        setItems(result.data || []);
      } catch {
        setError("No se pudieron cargar los mantenimientos");
      } finally {
        setLoading(false);
      }
    }

    loadFollowUps();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === "all") return true;
      return item.follow_up_status?.code === filter;
    });
  }, [items, filter]);

  if (loading) {
    return (
      <main className="p-6 md:p-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Cargando mantenimientos...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 md:p-8">
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Gestión de mantenimientos
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Mantenimientos
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {filteredItems.length} de {items.length} mantenimientos
              </p>
            </div>
          </div>

          <Link
            href="/follow-ups/new"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo mantenimiento
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Estado
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={getFilterButtonClass(filter === "all")}
                >
                  Todos
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("pending")}
                  className={getFilterButtonClass(filter === "pending")}
                >
                  Pendientes
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("completed")}
                  className={getFilterButtonClass(filter === "completed")}
                >
                  Completados
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("postponed")}
                  className={getFilterButtonClass(filter === "postponed")}
                >
                  Pospuestos
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-semibold">{filteredItems.length}</span>{" "}
              resultado{filteredItems.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {filteredItems.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800">
              No se encontraron mantenimientos
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Prueba con otro filtro o registra un nuevo mantenimiento.
            </p>

            <Link
              href="/follow-ups/new"
              className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Crear mantenimiento
            </Link>
          </section>
        ) : (
          <ul className="space-y-4">
            {filteredItems.map((item) => {
              const formattedTargetDate = formatDateLabel(item.target_date);
              const formattedInstallationDate = formatDateLabel(
                item.installation?.installation_date,
              );
              const timingMeta = getTimingMeta(item.target_date);
              const clientName = getClientName(item.client);

              return (
                <li
                  key={item.follow_up_id}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:p-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/follow-ups/${item.follow_up_id}`}
                            className="block"
                          >
                            <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900 transition group-hover:text-slate-700">
                              {clientName}
                            </h2>
                          </Link>

                          <p className="mt-2 text-sm text-slate-600">
                            {item.reason || "Mantenimiento programado"}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                item.follow_up_status?.code,
                              )}`}
                            >
                              {item.follow_up_status?.name || "Sin estado"}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                                item.priority,
                              )}`}
                            >
                              Prioridad {item.priority ?? "-"}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${timingMeta.classes}`}
                            >
                              {timingMeta.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/follow-ups/${item.follow_up_id}`}
                        className="mt-5 block"
                      >
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Fecha objetivo
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-800">
                              {formattedTargetDate || "No disponible"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Instalación
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-800">
                              {item.installation?.description ||
                                "Sin instalación asociada"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Fecha de instalación
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-800">
                              {formattedInstallationDate || "No disponible"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="flex flex-row flex-wrap gap-2 xl:w-auto xl:flex-col xl:items-end">
                      <Link
                        href={`/follow-ups/${item.follow_up_id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver detalle
                      </Link>

                      <Link
                        href={`/contact-attempts/new?follow_up_id=${item.follow_up_id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Registrar intento
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
