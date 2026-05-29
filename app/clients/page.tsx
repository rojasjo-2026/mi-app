"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  normalizeClientStatus,
  type ClientStatus,
} from "@/lib/clients/clientStatus";
import { getClientFullName } from "@/lib/clients/clientList.utils";
import { ClientListToast } from "@/components/clients/list/ClientListToast";
import { ClientListLoadingState } from "@/components/clients/list/ClientListLoadingState";
import { ClientListErrorState } from "@/components/clients/list/ClientListErrorState";
import { ClientListFilters } from "@/components/clients/list/ClientListFilters";
import { ClientListCard } from "@/components/clients/list/ClientListCard";
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

type ClientMetricCardProps = {
  title: string;
  value: string | number;
  detail: string;
  icon: string;
  accentClass: string;
  bgClass: string;
};

function ClientMetricCard({
  title,
  value,
  detail,
  icon,
  accentClass,
  bgClass,
}: ClientMetricCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className={`rounded-2xl ${bgClass} p-3 text-xl`}>{icon}</div>

        <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
          Clientes
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <p className={`mt-2 text-3xl font-black ${accentClass}`}>{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{detail}</p>
      </div>
    </article>
  );
}

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

  const clientStats = useMemo(() => {
    const active = clients.filter(
      (client) => normalizeClientStatus(client.client_status) === "ACTIVE",
    ).length;

    const prospect = clients.filter(
      (client) => normalizeClientStatus(client.client_status) === "PROSPECT",
    ).length;

    const onHold = clients.filter(
      (client) => normalizeClientStatus(client.client_status) === "ON_HOLD",
    ).length;

    const inactive = clients.filter(
      (client) => normalizeClientStatus(client.client_status) === "INACTIVE",
    ).length;

    const withWhatsApp = clients.filter((client) =>
      Boolean(client.whatsapp_opt_in),
    ).length;

    return {
      total: clients.length,
      active,
      prospect,
      withWhatsApp,
      attention: onHold + inactive,
    };
  }, [clients]);

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
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">
      <ClientListToast toast={toast} />

      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Clientes
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Gestión de clientes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Administra clientes, contactos, ubicaciones, WhatsApp y actividad
              operativa desde una sola pantalla.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <Link
              href="/clients/new"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Nuevo cliente
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientMetricCard
            title="Clientes totales"
            value={clientStats.total}
            detail={`${filteredClients.length} visibles con los filtros actuales`}
            icon="👥"
            accentClass="text-slate-950"
            bgClass="bg-slate-100"
          />

          <ClientMetricCard
            title="Clientes activos"
            value={clientStats.active}
            detail="Disponibles para operación y seguimiento"
            icon="✅"
            accentClass="text-emerald-600"
            bgClass="bg-emerald-50"
          />

          <ClientMetricCard
            title="Con WhatsApp"
            value={clientStats.withWhatsApp}
            detail="Clientes habilitados para contacto automatizado"
            icon="💬"
            accentClass="text-blue-600"
            bgClass="bg-blue-50"
          />

          <ClientMetricCard
            title="Requieren atención"
            value={clientStats.attention}
            detail="Clientes en espera o inactivos"
            icon="⚠️"
            accentClass="text-orange-600"
            bgClass="bg-orange-50"
          />
        </div>

        <ClientListFilters
          search={search}
          statusFilter={statusFilter}
          whatsFilter={whatsFilter}
          sort={sort}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onWhatsFilterChange={setWhatsFilter}
          onSortChange={(value) => setSort(value)}
        />

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Mostrando {filteredClients.length} resultado
              {filteredClients.length === 1 ? "" : "s"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Total registrado: {clients.length} cliente
              {clients.length === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilter !== "all" && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Estado: {statusFilter}
              </span>
            )}

            {whatsFilter !== "all" && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                WhatsApp:{" "}
                {whatsFilter === "with" ? "Con WhatsApp" : "Sin WhatsApp"}
              </span>
            )}

            {search.trim() && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                Búsqueda activa
              </span>
            )}
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <ClientListEmptyState />
        ) : (
          <ul className="space-y-4">
            {filteredClients.map((client) => (
              <ClientListCard
                key={client.client_id}
                client={client}
                onToggleStatus={toggleStatus}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
