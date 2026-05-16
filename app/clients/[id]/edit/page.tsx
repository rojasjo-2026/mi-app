"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientForm from "@/components/clients/ClientForm";
import { normalizeClientStatus, type ClientStatus } from "@/lib/clients/clientStatus";

type ClientType = "PERSON" | "COMPANY" | "OTHER";
type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

type ClientDetail = {
  client_id?: string;
  id?: string;

  client_type?: ClientType | null;
  compliance_profile?: ClientComplianceProfile | null;

  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;

  identification_country?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;

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

  client_status?: ClientStatus | string | null;
  whatsapp_opt_in?: boolean | null;

  default_payment_term?: "CASH" | "CREDIT" | null;
  default_credit_days?: number | string | null;
  default_discount_rate?: number | string | null;
  credit_limit?: number | string | null;

  billing_same_as_client?: boolean | null;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;

  tax_id?: string | null;
  tax_exempt?: boolean | null;
  preferred_currency?: "CRC" | "USD" | null;
};

function normalizeClientType(value?: string | null): ClientType {
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  if (normalizedValue === "COMPANY") {
    return "COMPANY";
  }

  if (normalizedValue === "OTHER") {
    return "OTHER";
  }

  return "PERSON";
}

function normalizeComplianceProfile(
  value?: string | null,
): ClientComplianceProfile {
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  if (normalizedValue === "GLOBAL") {
    return "GLOBAL";
  }

  return "COSTA_RICA";
}

function normalizePaymentTerm(value?: string | null): "CASH" | "CREDIT" {
  return value === "CREDIT" ? "CREDIT" : "CASH";
}

function normalizeCurrency(value?: string | null): "CRC" | "USD" {
  return value === "USD" ? "USD" : "CRC";
}

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

          client_type: normalizeClientType(clientData.client_type),
          compliance_profile: normalizeComplianceProfile(
            clientData.compliance_profile,
          ),

          display_name: clientData.display_name ?? "",
          legal_name: clientData.legal_name ?? "",
          company_name: clientData.company_name ?? "",
          commercial_name: clientData.commercial_name ?? "",
          main_contact_name: clientData.main_contact_name ?? "",

          identification_country: clientData.identification_country ?? "CR",
          identification_type: clientData.identification_type ?? null,
          identification_number:
            clientData.identification_number ?? clientData.tax_id ?? "",

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

          client_status: normalizeClientStatus(clientData.client_status),
          whatsapp_opt_in: clientData.whatsapp_opt_in ?? true,

          default_payment_term: normalizePaymentTerm(
            clientData.default_payment_term,
          ),
          default_credit_days: clientData.default_credit_days ?? null,
          default_discount_rate: clientData.default_discount_rate ?? null,
          credit_limit: clientData.credit_limit ?? null,

          billing_same_as_client: clientData.billing_same_as_client ?? true,
          billing_name: clientData.billing_name ?? "",
          billing_email: clientData.billing_email ?? "",
          billing_phone: clientData.billing_phone ?? "",
          billing_address: clientData.billing_address ?? "",

          tax_id: clientData.tax_id ?? clientData.identification_number ?? "",
          tax_exempt: clientData.tax_exempt ?? false,
          preferred_currency: normalizeCurrency(clientData.preferred_currency),
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
