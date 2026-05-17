"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientForm from "@/components/clients/ClientForm";
import { useClientDetail } from "@/hooks/clients/useClientDetail";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : undefined;

  const { client, loading, error } = useClientDetail(id);

  const initialData = useMemo(() => {
    if (!client || !id) {
      return null;
    }

    return {
      ...client,
      id: client.client_id ?? id,
      client_id: client.client_id ?? id,
    };
  }, [client, id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Cargando cliente...
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (error || !initialData) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-red-600">
              {error || "Cliente no encontrado"}
            </p>

            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver a clientes
            </button>
          </section>
        </div>
      </main>
    );
  }

  return <ClientForm mode="edit" initialData={initialData} />;
}
