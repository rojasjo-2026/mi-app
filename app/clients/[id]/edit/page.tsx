"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientForm from "@/components/clients/ClientForm";

type ClientDetail = {
  client_id?: string;
  id?: string;
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  phone_primary?: string | null;
  phone_secondary?: string | null;
  email?: string | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  client_status?: string | null;
  whatsapp_opt_in?: boolean | null;
};

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClient() {
      if (!id) {
        setError("Cliente no encontrado");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/clients/${id}`, {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || "Failed to load client");
        }

        const clientData = result.data;

        setClient({
          id: clientData.client_id ?? clientData.id ?? id,
          client_id: clientData.client_id ?? clientData.id ?? id,
          first_name: clientData.first_name ?? "",
          last_name_1: clientData.last_name_1 ?? "",
          last_name_2: clientData.last_name_2 ?? "",
          phone_primary: clientData.phone_primary ?? "",
          phone_secondary: clientData.phone_secondary ?? "",
          email: clientData.email ?? "",
          address_line: clientData.address_line ?? "",
          admin_level_1: clientData.admin_level_1 ?? "",
          admin_level_2: clientData.admin_level_2 ?? "",
          admin_level_3: clientData.admin_level_3 ?? "",
          client_status: clientData.client_status ?? "active",
          whatsapp_opt_in: clientData.whatsapp_opt_in ?? true,
        });
      } catch {
        setError("No se pudo cargar el cliente");
      } finally {
        setLoading(false);
      }
    }

    loadClient();
  }, [id]);

  if (loading) {
    return <main className="p-6">Cargando cliente...</main>;
  }

  if (error) {
    return (
      <main className="space-y-4 p-6">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Volver a clientes
        </button>
      </main>
    );
  }

  if (!client) {
    return (
      <main className="space-y-4 p-6">
        <p>Cliente no encontrado</p>
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Volver a clientes
        </button>
      </main>
    );
  }

  return <ClientForm mode="edit" initialData={client} />;
}
