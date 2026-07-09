"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InstallationForm from "@/components/installations/InstallationForm";

type TechnicianOption = {
  user_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  role?: "TECHNICIAN" | "SUPERVISOR" | "ADMINISTRATION" | "ADMIN" | string;
  is_active?: boolean | null;
};

type InstallationDetail = {
  installation_id: string;
  description?: string | null;
  service_type_id?: number | string | null;
  installation_date?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  technician_name?: string | null;
  technician_id?: string | null;
  technician?: TechnicianOption | null;
  warranty_months?: number | string | null;
  estimated_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  installation_status?: string | null;
  operational_zone_id?: string | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  location_notes?: string | null;
  reference_point?: string | null;
};

export default function EditInstallationPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [installation, setInstallation] = useState<InstallationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInstallation() {
      if (!id) {
        setError("Instalación no encontrada");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/installations/${id}`, {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || "No se pudo cargar la instalación");
        }

        setInstallation(result.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la instalación",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInstallation();
  }, [id]);

  if (loading) {
    return <main className="p-6">Cargando instalación...</main>;
  }

  if (error || !installation) {
    return <main className="p-6">{error || "Instalación no encontrada"}</main>;
  }

  return <InstallationForm mode="edit" initialData={installation} />;
}
