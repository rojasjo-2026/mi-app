"use client";

import { useEffect, useMemo, useState } from "react";
import {
  normalizeClientStatus,
  type ClientStatus,
} from "@/lib/clients/clientStatus";
import { getClientFullName } from "@/lib/clients/clientList.utils";
import { ClientListToast } from "@/components/clients/list/ClientListToast";
import { ClientListLoadingState } from "@/components/clients/list/ClientListLoadingState";
import { ClientListErrorState } from "@/components/clients/list/ClientListErrorState";
import { ClientListHeader } from "@/components/clients/list/ClientListHeader";
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
            {filteredClients.map((client) => (
              <ClientListCard
                key={client.client_id}
                client={client}
                onToggleStatus={toggleStatus}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
