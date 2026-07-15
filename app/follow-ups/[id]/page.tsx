"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import FollowUpClientSection from "./components/FollowUpClientSection";
import FollowUpContactFlowSection from "./components/FollowUpContactFlowSection";
import FollowUpContactHistorySection from "./components/FollowUpContactHistorySection";
import FollowUpFilesSection from "./components/FollowUpFilesSection";
import FollowUpHeader from "./components/FollowUpHeader";
import FollowUpInfoSection from "./components/FollowUpInfoSection";
import FollowUpInstallationSection from "./components/FollowUpInstallationSection";
import FollowUpNotesSection from "./components/FollowUpNotesSection";
import FollowUpCollapsibleSection from "./components/FollowUpCollapsibleSection";
import FollowUpCommercialSection, {
  formatBillingStatus,
  formatMaintenanceType,
} from "./components/FollowUpCommercialSection";
import {
  type FollowUpDetail,
  type FollowUpEditForm,
  getClientFullName,
  getPriorityClasses,
  getStatusClasses,
  getTechnicianName,
  getTimingMeta,
  toDateInputValue,
} from "./utils";

type TechnicianOption = {
  user_id: string;
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  email?: string | null;
};

function toSafeNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatBusinessMoney(
  value?: number | string | null,
  currency?: string | null,
  locale = "es",
) {
  const amount = toSafeNumber(value);

  if (amount === null) return "-";

  const currencyCode = currency?.trim().toUpperCase();

  if (!currencyCode) {
    return amount.toLocaleString(locale, {
      maximumFractionDigits: 0,
    });
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  }
}

function formatBusinessDate(value?: string | null, locale = "es") {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBusinessDateTime(value?: string | null, locale = "es") {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNumberInputValue(value?: number | null) {
  return value !== null && value !== undefined ? String(value) : "";
}

function getFollowUpTechnicianLabel(followUp: FollowUpDetail) {
  const assignedTechnicianName = getTechnicianName(followUp.technician);

  if (assignedTechnicianName !== "-") {
    return assignedTechnicianName;
  }

  return followUp.installation?.technician_name || "-";
}

function buildEditFormFromFollowUp(followUp: FollowUpDetail): FollowUpEditForm {
  return {
    reason: followUp.reason || "",
    priority: followUp.priority ?? 3,
    target_date: toDateInputValue(followUp.target_date),
    due_date: toDateInputValue(followUp.due_date),
    estimated_amount: getNumberInputValue(followUp.estimated_amount),
    final_amount: getNumberInputValue(followUp.final_amount),
    cost_amount: getNumberInputValue(followUp.cost_amount),
    billing_status: followUp.billing_status || "PENDING",
    billing_notes: followUp.billing_notes || "",
    maintenance_type: followUp.maintenance_type || "",
    technician_id: followUp.technician_id || "",
  };
}

export default function FollowUpDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [followUp, setFollowUp] = useState<FollowUpDetail | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [postponing, setPostponing] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<FollowUpEditForm>({
    reason: "",
    priority: 3,
    target_date: "",
    due_date: "",
    estimated_amount: "",
    final_amount: "",
    cost_amount: "",
    billing_status: "PENDING",
    billing_notes: "",
    maintenance_type: "",
    technician_id: "",
  });

  const { businessCountryMeta } = useAppSettings();

  const businessCurrency =
    (businessCountryMeta as { currency?: string | null }).currency ||
    businessCountryMeta.countryPreset.primaryCurrency;

  const businessLocale = businessCountryMeta.locale || "es";

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setError("Mantenimiento no encontrado");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/follow-ups/${id}`, {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || "Failed to load maintenance");
        }

        setFollowUp(result.data);
      } catch {
        setError("No se pudo cargar el mantenimiento");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id]);

  useEffect(() => {
    async function loadTechnicians() {
      try {
        const res = await fetch("/api/users?role=TECHNICIAN&is_active=true", {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error("Failed to load technicians");
        }

        setTechnicians(Array.isArray(result.data) ? result.data : []);
      } catch {
        setTechnicians([]);
      } finally {
        setLoadingTechnicians(false);
      }
    }

    void loadTechnicians();
  }, []);

  useEffect(() => {
    if (!followUp) return;

    setEditForm(buildEditFormFromFollowUp(followUp));
  }, [followUp]);

  async function handleCompleteFollowUp() {
    if (!followUp) return;

    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/follow-ups/${followUp.follow_up_id}`, {
        method: "PUT",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error();
      }

      setFollowUp(result.data);
    } catch {
      alert("No se pudo cambiar el estado");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handlePostponeFollowUp() {
    if (!followUp) return;

    const newDate = window.prompt(
      "Ingrese la nueva fecha del mantenimiento (YYYY-MM-DD):",
      followUp.target_date
        ? new Date(followUp.target_date).toISOString().slice(0, 10)
        : "",
    );

    if (!newDate) return;

    setPostponing(true);

    try {
      const res = await fetch(
        `/api/follow-ups/${followUp.follow_up_id}/postpone`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_date: newDate,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error();
      }

      setFollowUp(result.data);
    } catch {
      alert("No se pudo posponer el mantenimiento");
    } finally {
      setPostponing(false);
    }
  }

  function handleCancelEdit() {
    if (!followUp) {
      setIsEditing(false);
      return;
    }

    setEditForm(buildEditFormFromFollowUp(followUp));
    setIsEditing(false);
  }

  async function handleSaveEdit() {
    if (!followUp) return;

    setSavingEdit(true);

    try {
      const res = await fetch(`/api/follow-ups/${followUp.follow_up_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: editForm.reason,
          priority: editForm.priority,
          target_date: editForm.target_date,
          due_date: editForm.due_date || null,
          estimated_amount: editForm.estimated_amount
            ? Number(editForm.estimated_amount)
            : null,
          final_amount: editForm.final_amount
            ? Number(editForm.final_amount)
            : null,
          cost_amount: editForm.cost_amount
            ? Number(editForm.cost_amount)
            : null,
          billing_status: editForm.billing_status || "PENDING",
          billing_notes: editForm.billing_notes || null,
          maintenance_type: editForm.maintenance_type || null,
          technician_id: editForm.technician_id || null,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudo guardar");
      }

      setFollowUp(result.data);
      setIsEditing(false);
    } catch {
      alert("No se pudieron guardar los cambios");
    } finally {
      setSavingEdit(false);
    }
  }

  function updateEditField<K extends keyof FollowUpEditForm>(
    field: K,
    value: FollowUpEditForm[K],
  ) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function goToNewContact() {
    if (!followUp) return;
    window.location.href = `/contact-attempts/new?follow_up_id=${followUp.follow_up_id}`;
  }

  function goToClient() {
    if (!followUp?.client?.client_id) return;
    window.location.href = `/clients/${followUp.client.client_id}`;
  }

  function goToInstallation() {
    if (!followUp?.installation?.installation_id) return;
    window.location.href = `/installations/${followUp.installation.installation_id}`;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-4 md:p-6 xl:p-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Cargando mantenimiento...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !followUp) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-4 md:p-6 xl:p-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-red-600">
              {error || "Mantenimiento no encontrado"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const clientName = getClientFullName(followUp.client);
  const installationDescription =
    followUp.installation?.description || "Sin instalación asociada";
  const timingMeta = getTimingMeta(followUp.target_date);
  const technicianLabel = getFollowUpTechnicianLabel(followUp);

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 md:p-6 xl:p-8">
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <FollowUpHeader
          title={followUp.reason || "Mantenimiento"}
          clientName={clientName}
          installationDescription={installationDescription}
          statusName={followUp.follow_up_status?.name || "Sin estado"}
          statusClassName={getStatusClasses(followUp.follow_up_status?.code)}
          priorityLabel={`Prioridad ${followUp.priority ?? "-"}`}
          priorityClassName={getPriorityClasses(followUp.priority)}
          timingLabel={timingMeta.label}
          timingClassName={timingMeta.classes}
          isEditing={isEditing}
          savingEdit={savingEdit}
          canViewInstallation={Boolean(followUp.installation?.installation_id)}
          postponing={postponing}
          updatingStatus={updatingStatus}
          isCompleted={followUp.follow_up_status?.code === "completed"}
          onEdit={() => setIsEditing(true)}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          onViewInstallation={goToInstallation}
          onBack={() => window.history.back()}
          onNewContact={goToNewContact}
          onPostpone={handlePostponeFollowUp}
          onComplete={handleCompleteFollowUp}
        />

        <FollowUpCollapsibleSection title="Información general" defaultOpen>
          <FollowUpInfoSection
            isEditing={isEditing}
            form={editForm}
            completedAtLabel={formatBusinessDate(
              followUp.completed_at,
              businessLocale,
            )}
            createdFrom={followUp.created_from || "-"}
            targetDateLabel={formatBusinessDate(
              followUp.target_date,
              businessLocale,
            )}
            dueDateLabel={formatBusinessDate(followUp.due_date, businessLocale)}
            reasonLabel={followUp.reason || "Mantenimiento programado"}
            priorityLabel={String(followUp.priority ?? "-")}
            onChange={updateEditField}
          />
        </FollowUpCollapsibleSection>

        <FollowUpCollapsibleSection title="Información comercial">
          <FollowUpCommercialSection
            isEditing={isEditing}
            form={editForm}
            estimatedAmountLabel={formatBusinessMoney(
              followUp.estimated_amount,
              businessCurrency,
              businessLocale,
            )}
            finalAmountLabel={formatBusinessMoney(
              followUp.final_amount,
              businessCurrency,
              businessLocale,
            )}
            costAmountLabel={formatBusinessMoney(
              followUp.cost_amount,
              businessCurrency,
              businessLocale,
            )}
            billingStatusLabel={formatBillingStatus(followUp.billing_status)}
            billingNotesLabel={followUp.billing_notes || "-"}
            maintenanceTypeLabel={formatMaintenanceType(
              followUp.maintenance_type,
            )}
            technicianLabel={technicianLabel}
            technicians={technicians}
            loadingTechnicians={loadingTechnicians}
            onChange={updateEditField}
          />
        </FollowUpCollapsibleSection>

        <FollowUpCollapsibleSection title="Cliente e instalación">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FollowUpClientSection
              name={clientName}
              phone={followUp.client?.phone_primary || "-"}
              email={followUp.client?.email || "-"}
              onViewClient={goToClient}
            />

            <FollowUpInstallationSection
              hasInstallation={Boolean(followUp.installation)}
              description={followUp.installation?.description || "-"}
              installationDate={formatBusinessDate(
                followUp.installation?.installation_date,
                businessLocale,
              )}
              technician={followUp.installation?.technician_name || "-"}
              onViewInstallation={goToInstallation}
            />
          </section>
        </FollowUpCollapsibleSection>

        <FollowUpCollapsibleSection title="Notas">
          <FollowUpNotesSection followUpId={followUp.follow_up_id} />
        </FollowUpCollapsibleSection>

        <FollowUpCollapsibleSection title="Archivos">
          <FollowUpFilesSection followUpId={followUp.follow_up_id} />
        </FollowUpCollapsibleSection>

        <FollowUpCollapsibleSection title="Gestión de contacto">
          <FollowUpContactFlowSection followUpId={followUp.follow_up_id} />
        </FollowUpCollapsibleSection>

        <FollowUpCollapsibleSection title="Historial del mantenimiento">
          <FollowUpContactHistorySection
            clientId={followUp.client?.client_id}
            followUpId={followUp.follow_up_id}
            formatDate={(value) => formatBusinessDate(value, businessLocale)}
            formatDateTime={(value) =>
              formatBusinessDateTime(value, businessLocale)
            }
          />
        </FollowUpCollapsibleSection>
      </div>
    </main>
  );
}
