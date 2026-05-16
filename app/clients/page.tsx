"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  normalizeClientStatus,
  getClientStatusLabel,
  getClientStatusBadgeClass,
  type ClientStatus,
} from "@/lib/clients/clientStatus";
import {
  getClientFullName,
  getLocationLabel,
  getFilterButtonClass,
  formatDateLabel,
} from "@/lib/clients/clientList.utils";
import { ClientListToast } from "@/components/clients/list/ClientListToast";
import { ClientListLoadingState } from "@/components/clients/list/ClientListLoadingState";
import { ClientListErrorState } from "@/components/clients/list/ClientListErrorState";
import { ClientListHeader } from "@/components/clients/list/ClientListHeader";
import { ClientListEmptyState } from "@/components/clients/list/ClientListEmptyState";

type Client = {
  client_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  phone_primary: string;
  email?: string | null;
  client_status?: ClientStatus | string | null;
  whatsapp_opt_in?: boolean | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  maintenance_count?: number;
  last_maintenance?: string | null;
  last_contact?: string | null;
};

type StatusFilter = "all" | ClientStatus;
type WhatsAppFilter = "all" | "with" | "without";
type SortType = "name" | "recent";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [whatsFilter, setWhatsFilter] = useState<WhatsAppFilter>("all");
  const [sort, setSort] = useState<SortType>("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients", {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error("Error loading clients");
        }

        setClients(result.data || []);
      } catch {
        setError("No se pudieron cargar los clientes");
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => clearTimeout(timeout);
  }, [toast]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = clients.filter((client) => {
      const fullName = getClientFullName(client).toLowerCase();
      const phone = client.phone_primary?.toLowerCase() || "";
      const email = client.email?.toLowerCase() || "";
      const province = client.admin_level_1?.toLowerCase() || "";
      const canton = client.admin_level_2?.toLowerCase() || "";
      const status = normalizeClientStatus(client.client_status);

      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        province.includes(term) ||
        canton.includes(term);

      const matchesStatus =
        statusFilter === "all" ? true : status === statusFilter;

      const matchesWhatsApp =
        whatsFilter === "all"
          ? true
          : whatsFilter === "with"
            ? Boolean(client.whatsapp_opt_in)
            : !client.whatsapp_opt_in;

      return matchesSearch && matchesStatus && matchesWhatsApp;
    });

    result.sort((a, b) => {
      if (sort === "name") {
        return getClientFullName(a).localeCompare(getClientFullName(b));
      }

      return 0;
    });

    return result;
  }, [clients, search, statusFilter, whatsFilter, sort]);

  async function toggleStatus(client: Client) {
    const currentStatus = normalizeClientStatus(client.client_status);
    const newStatus: ClientStatus =
      currentStatus === "INACTIVE" ? "ACTIVE" : "INACTIVE";

    try {
      const res = await fetch(`/api/clients/${client.client_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_status: newStatus }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error("No se pudo actualizar el estado");
      }

      setClients((prev) =>
        prev.map((c) =>
          c.client_id === client.client_id
            ? { ...c, client_status: newStatus }
            : c,
        ),
      );

      setToast({
        type: "success",
        message:
          newStatus === "INACTIVE" ? "Cliente desactivado" : "Cliente activado",
      });
    } catch {
      setToast({
        type: "error",
        message: "No se pudo actualizar el estado del cliente",
      });
    }
  }

  if (loading) {
    return <ClientListLoadingState />;
  }

  if (error) {
    return <ClientListErrorState message={error} />;
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <ClientListToast toast={toast} />

      <div className="mx-auto max-w-7xl space-y-6">
        <ClientListHeader
          filteredCount={filteredClients.length}
          totalCount={clients.length}
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="space-y-5">
            <div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente por nombre, teléfono, email o ubicación..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Estado
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={getFilterButtonClass(statusFilter === "all")}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ACTIVE")}
                    className={getFilterButtonClass(statusFilter === "ACTIVE")}
                  >
                    Activos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("PROSPECT")}
                    className={getFilterButtonClass(
                      statusFilter === "PROSPECT",
                    )}
                  >
                    Prospectos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ON_HOLD")}
                    className={getFilterButtonClass(statusFilter === "ON_HOLD")}
                  >
                    En espera
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("INACTIVE")}
                    className={getFilterButtonClass(
                      statusFilter === "INACTIVE",
                    )}
                  >
                    Inactivos
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  WhatsApp
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWhatsFilter("all")}
                    className={getFilterButtonClass(whatsFilter === "all")}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsFilter("with")}
                    className={getFilterButtonClass(whatsFilter === "with")}
                  >
                    Con WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsFilter("without")}
                    className={getFilterButtonClass(whatsFilter === "without")}
                  >
                    Sin WhatsApp
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:min-w-[220px]">
                <label
                  htmlFor="sort"
                  className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"
                >
                  Ordenar por
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="name">Nombre</option>
                  <option value="recent">Más recientes</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-semibold">{filteredClients.length}</span>{" "}
              resultado{filteredClients.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {filteredClients.length === 0 ? (
          <ClientListEmptyState />
        ) : (
          <ul className="space-y-4">
            {filteredClients.map((client) => {
              const fullName = getClientFullName(client);
              const locationLabel = getLocationLabel(client);
              const status = normalizeClientStatus(client.client_status);
              const formattedLastMaintenance = formatDateLabel(
                client.last_maintenance,
              );
              const formattedLastContact = formatDateLabel(client.last_contact);

              return (
                <li
                  key={client.client_id}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:p-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/clients/${client.client_id}`}
                            className="block"
                          >
                            <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900 transition group-hover:text-slate-700">
                              {fullName}
                            </h2>
                          </Link>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getClientStatusBadgeClass(
                                status,
                              )}`}
                            >
                              {getClientStatusLabel(status)}
                            </span>

                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                              {client.whatsapp_opt_in
                                ? "WhatsApp habilitado"
                                : "Sin WhatsApp"}
                            </span>

                            {typeof client.maintenance_count === "number" && (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                {client.maintenance_count} mantenimiento
                                {client.maintenance_count === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/clients/${client.client_id}`}
                        className="mt-5 block"
                      >
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Teléfono
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-800">
                              {client.phone_primary}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Email
                            </p>
                            <p className="mt-2 break-words text-sm font-medium text-slate-800">
                              {client.email || "Sin email registrado"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Ubicación
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-800">
                              {locationLabel || "Sin ubicación registrada"}
                            </p>
                          </div>

                          {formattedLastMaintenance && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                Último mantenimiento
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-800">
                                {formattedLastMaintenance}
                              </p>
                            </div>
                          )}

                          {formattedLastContact && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                Último contacto
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-800">
                                {formattedLastContact}
                              </p>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>

                    <div className="flex flex-row flex-wrap gap-2 xl:w-auto xl:flex-col xl:items-end">
                      <Link
                        href={`/clients/${client.client_id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleStatus(client)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {status === "INACTIVE" ? "Activar" : "Desactivar"}
                      </button>
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
