"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InstallationItem = {
  installation_id: string;
  installation_date: string;
  description: string | null;
  technician_name: string | null;
  installation_status: string;
  estimated_amount?: number | null;
  zone?: string | null;
  city?: string | null;
  address_line?: string | null;
  client?: {
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
  } | null;
  service_type?: {
    name?: string | null;
  } | null;
};

type FilterType = "all" | "active" | "inactive";
type SortType = "recent" | "oldest";

function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

function getStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "inactive") {
    return "border border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

function formatDateLabel(value?: string | null) {
  if (!value) return "No disponible";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatCurrency(value?: number | null) {
  if (value == null) return "No definido";

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);
}

function getClientName(client?: InstallationItem["client"]) {
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

function getLocationLabel(item: InstallationItem) {
  const parts = [item.city, item.zone, item.address_line]
    .filter(Boolean)
    .map((value) => value!.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "Ubicación no definida";
  }

  return parts.join(", ");
}

export default function InstallationsPage() {
  const [installations, setInstallations] = useState<InstallationItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");

  useEffect(() => {
    async function loadInstallations() {
      try {
        const response = await fetch("/api/installations", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "No se pudieron cargar las instalaciones",
          );
        }

        setInstallations(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las instalaciones",
        );
      } finally {
        setLoading(false);
      }
    }

    loadInstallations();
  }, []);

  const filteredInstallations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = installations.filter((item) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? item.installation_status?.toLowerCase() === "active"
            : item.installation_status?.toLowerCase() === "inactive";

      if (!matchesFilter) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        item.description,
        item.technician_name,
        item.client?.first_name,
        item.client?.last_name_1,
        item.client?.last_name_2,
        item.service_type?.name,
        item.city,
        item.zone,
        item.address_line,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    filtered.sort((a, b) => {
      const aDate = new Date(a.installation_date).getTime();
      const bDate = new Date(b.installation_date).getTime();

      if (sortBy === "oldest") {
        return aDate - bDate;
      }

      return bDate - aDate;
    });

    return filtered;
  }, [installations, search, filter, sortBy]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Cargando instalaciones...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
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
              Gestión de instalaciones
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Instalaciones
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Gestiona las instalaciones registradas y crea nuevas
              </p>
            </div>
          </div>

          <Link
            href="/installations/new"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nueva instalación
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar instalación
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, descripción o técnico"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-300"
              />
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
                    Todas
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("active")}
                    className={getFilterButtonClass(filter === "active")}
                  >
                    Activas
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("inactive")}
                    className={getFilterButtonClass(filter === "inactive")}
                  >
                    Inactivas
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start lg:self-auto">
                <label className="text-sm text-slate-600">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-300"
                >
                  <option value="recent">Más recientes</option>
                  <option value="oldest">Más antiguas</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-semibold">
                {filteredInstallations.length}
              </span>{" "}
              de <span className="font-semibold">{installations.length}</span>{" "}
              instalaciones
            </div>
          </div>
        </section>

        {filteredInstallations.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800">
              No se encontraron instalaciones
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Prueba con otro filtro o registra una nueva instalación.
            </p>
          </section>
        ) : (
          <ul className="space-y-5">
            {filteredInstallations.map((item) => (
              <li
                key={item.installation_id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md md:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                        {item.description || "Instalación sin descripción"}
                      </h2>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          item.installation_status || "",
                        )}`}
                      >
                        {item.installation_status || "Sin estado"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Cliente
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          {getClientName(item.client)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Fecha
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          {formatDateLabel(item.installation_date)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Servicio
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          {item.service_type?.name || "Sin servicio"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Técnico
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          {item.technician_name || "Técnico no asignado"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Ubicación
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          {getLocationLabel(item)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Monto estimado
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          {formatCurrency(item.estimated_amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row flex-wrap gap-2 xl:w-auto xl:flex-col xl:items-end">
                    <Link
                      href={`/installations/${item.installation_id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Ver detalle
                    </Link>

                    <Link
                      href={`/installations/${item.installation_id}/edit`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
