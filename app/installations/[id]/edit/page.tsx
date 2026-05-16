"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InstallationForm from "@/components/installations/InstallationForm";

type InstallationDetail = {
  installation_id: string;
  description?: string | null;
  technician_name?: string | null;
  warranty_months?: number | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  location_notes?: string | null;
  reference_point?: string | null;
};

export default function EditInstallationPage() {
  const params = useParams();
  const id = params?.id as string;

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
      } catch {
        setError("No se pudo cargar la instalación");
      } finally {
        setLoading(false);
      }
    }

    loadInstallation();
  }, [id]);

  if (loading) {
    return <main className="p-6">Cargando instalación...</main>;
  }

  if (error || !installation) {
    return <main className="p-6">{error || "Instalación no encontrada"}</main>;
  }

  return <InstallationForm mode="edit" initialData={installation} />;
}
