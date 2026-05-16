"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type InstallationOption = {
  installation_id: string;
  description?: string | null;
  installation_date?: string | null;
  client_id?: string | null;
  client?: {
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
  } | null;
};

function getClientName(client?: InstallationOption["client"]) {
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

function formatDateLabel(value?: string | null) {
  if (!value) return "Sin fecha";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FollowUpNewClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const installationIdFromQuery = searchParams.get("installationId") || "";

  const [installations, setInstallations] = useState<InstallationOption[]>([]);
  const [loadingInstallations, setLoadingInstallations] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState("");

  const [installationId, setInstallationId] = useState(installationIdFromQuery);
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("2");
  const [reason, setReason] = useState("");

  useEffect(() => {
    async function loadInstallations() {
      try {
        const res = await fetch("/api/installations", {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error("No se pudieron cargar las instalaciones");
        }

        setInstallations(Array.isArray(result.data) ? result.data : []);
      } catch {
        setError("No se pudieron cargar las instalaciones");
      } finally {
        setLoadingInstallations(false);
      }
    }

    loadInstallations();
  }, []);

  const selectedInstallation = useMemo(() => {
    return (
      installations.find((item) => item.installation_id === installationId) ||
      null
    );
  }, [installations, installationId]);

  const clientId = selectedInstallation?.client_id || "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!installationId) {
      setError("Debes seleccionar una instalación");
      return;
    }

    if (!clientId) {
      setError("La instalación seleccionada no tiene un cliente asociado");
      return;
    }

    if (!targetDate) {
      setError("Debes seleccionar una fecha objetivo");
      return;
    }

    setLoadingSubmit(true);

    try {
      const payload = {
        installation_id: installationId,
        client_id: clientId,
        target_date: targetDate,
        priority: Number(priority),
        reason: reason.trim() || null,
      };

      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudo crear el mantenimiento");
      }

      router.push("/follow-ups");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el mantenimiento",
      );
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Gestión de mantenimientos
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Nuevo mantenimiento
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Crea un mantenimiento a partir de una instalación existente.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/follow-ups"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Instalación
                </label>

                <select
                  value={installationId}
                  onChange={(e) => setInstallationId(e.target.value)}
                  disabled={loadingInstallations}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  <option value="">
                    {loadingInstallations
                      ? "Cargando instalaciones..."
                      : "Selecciona una instalación"}
                  </option>

                  {installations.map((item) => (
                    <option
                      key={item.installation_id}
                      value={item.installation_id}
                    >
                      {getClientName(item.client)} —{" "}
                      {item.description || "Instalación sin descripción"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Fecha objetivo
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                  >
                    <option value="1">1 - Alta</option>
                    <option value="2">2 - Media</option>
                    <option value="3">3 - Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Motivo o detalle
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  placeholder="Ejemplo: revisión preventiva, limpieza, ajuste o control de garantía"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loadingSubmit || loadingInstallations}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingSubmit ? "Guardando..." : "Crear mantenimiento"}
                </button>

                <Link
                  href="/follow-ups"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Resumen
              </p>

              {selectedInstallation ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {getClientName(selectedInstallation.client)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedInstallation.description ||
                        "Instalación sin descripción"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Fecha de instalación
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDateLabel(selectedInstallation.installation_date)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Client ID
                    </p>
                    <p className="mt-2 break-all text-sm font-medium text-slate-800">
                      {clientId || "No disponible"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Installation ID
                    </p>
                    <p className="mt-2 break-all text-sm font-medium text-slate-800">
                      {selectedInstallation.installation_id}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Selecciona una instalación para ver el resumen del
                  mantenimiento.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Nota
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Este formulario crea el mantenimiento directamente en el listado
                general. Si una instalación no aparece o no tiene cliente
                asociado, primero corrige esa información desde la sección de
                instalaciones.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
