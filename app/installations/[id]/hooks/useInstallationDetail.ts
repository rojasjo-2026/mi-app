"use client";

import { useCallback, useEffect, useState } from "react";
import type { InstallationDetail } from "@/lib/installations/installation-detail.types";
import { getSuggestedMaintenanceDate } from "../utils/installationDetailSelectors";

type UseInstallationDetailParams = {
  id: string;
};

export function useInstallationDetail({ id }: UseInstallationDetailParams) {
  const [installation, setInstallation] = useState<InstallationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingMaintenance, setCreatingMaintenance] = useState(false);
  const [completingFollowUpId, setCompletingFollowUpId] = useState<
    string | null
  >(null);
  const [deactivatingInstallation, setDeactivatingInstallation] =
    useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadInstallation = useCallback(async () => {
    if (!id) {
      setError("Instalación no encontrada");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/installations/${id}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load installation");
      }

      setInstallation(result.data);
    } catch {
      setError("No se pudo cargar la instalación");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadInstallation();
  }, [loadInstallation]);

  async function handleCreateMaintenance() {
    const isInactive = installation?.is_active === false;

    if (isInactive) {
      setActionMessage(
        "No se puede programar mantenimiento en una instalación inactiva",
      );
      return;
    }

    if (!installation?.client?.client_id || !installation.installation_id) {
      setActionMessage("No se pudo programar el mantenimiento");
      return;
    }

    setCreatingMaintenance(true);
    setActionMessage("");

    try {
      window.location.href = `/follow-ups/new?installationId=${installation.installation_id}`;
    } catch (err) {
      console.error(err);
      setActionMessage("No se pudo abrir el formulario de mantenimiento");
      setCreatingMaintenance(false);
    }
  }

  async function handleCompleteMaintenance(followUpId: string) {
    try {
      setCompletingFollowUpId(followUpId);
      setActionMessage("");

      const res = await fetch(`/api/follow-ups/${followUpId}`, {
        method: "PUT",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo completar el mantenimiento",
        );
      }

      setActionMessage("Mantenimiento completado correctamente");
      await loadInstallation();

      setTimeout(() => {
        setActionMessage("");
      }, 2000);
    } catch (err) {
      console.error(err);
      setActionMessage("No se pudo completar el mantenimiento");
    } finally {
      setCompletingFollowUpId(null);
    }
  }

  async function handleDeactivateInstallation() {
    if (!installation?.installation_id || installation.is_active === false)
      return;

    const confirmed = window.confirm(
      "¿Seguro que deseas desactivar esta instalación?",
    );

    if (!confirmed) return;

    try {
      setDeactivatingInstallation(true);
      setActionMessage("");

      const userId = "demo-user";

      const res = await fetch(
        `/api/installations/${installation.installation_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            changed_by: userId,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo desactivar la instalación",
        );
      }

      setActionMessage("Instalación desactivada correctamente");
      await loadInstallation();

      setTimeout(() => {
        setActionMessage("");
      }, 2000);
    } catch (err) {
      console.error(err);
      setActionMessage("No se pudo desactivar la instalación");
    } finally {
      setDeactivatingInstallation(false);
    }
  }

  return {
    installation,
    loading,
    error,
    creatingMaintenance,
    completingFollowUpId,
    deactivatingInstallation,
    actionMessage,
    setActionMessage,
    loadInstallation,
    handleCreateMaintenance,
    handleCompleteMaintenance,
    handleDeactivateInstallation,
  };
}
