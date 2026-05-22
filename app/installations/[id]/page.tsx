"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import MetricCard from "./components/MetricCard";
import StaffMetricCard from "./components/StaffMetricCard";
import InstallationStatusAlerts from "./components/InstallationStatusAlerts";
import InstallationChangeLogSection from "./components/InstallationChangeLogSection";
import InstallationFollowUpsSection from "./components/InstallationFollowUpsSection";
import InstallationLocationDisplay from "./components/InstallationLocationDisplay";
import InstallationDetailHeader from "./components/InstallationDetailHeader";
import InstallationMainInfoSection from "./components/InstallationMainInfoSection";
import InstallationClientSection from "./components/InstallationClientSection";
import InstallationTechnicianSection from "./components/InstallationTechnicianSection";
import InstallationFilesSection from "./components/InstallationFilesSection";
import InstallationActivityHistorySection from "./components/InstallationActivityHistorySection";
import Card from "./components/Card";
import { useInstallationDetail } from "./hooks/useInstallationDetail";
import {
  getClientFullName,
  getInstallationStatusLabel,
} from "./utils/installationDetailFormatters";
import {
  getGoogleMapsUrl,
  getLatitude,
  getLongitude,
  getNextPendingFollowUp,
  getOpenStreetMapEmbedUrl,
  hasCoordinates,
} from "./utils/installationDetailSelectors";
import type { ClientNameParts } from "./types/installationDetailPage.types";
import {
  formatDate,
  getTechnicianDisplayName,
} from "@/lib/installations/installation-detail.utils";
import InstallationComponentsSection from "@/components/installations/InstallationComponentsSection";

type InstallationCommercialInfo = {
  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  warranty_months?: number | string | null;
};

function getInstallationStatusBadge(status?: string | null) {
  if (status === "OPEN") {
    return (
      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Abierta
      </span>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        En proceso
      </span>
    );
  }

  if (status === "CLOSED") {
    return (
      <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
        Completada
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Cancelada
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      {status || "Sin estado"}
    </span>
  );
}

function formatCurrencyLabel(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatOptionalCurrencyLabel(value?: number | string | null) {
  const formattedValue = formatCurrencyLabel(value);

  return formattedValue === "-" ? undefined : formattedValue;
}

function getBillingStatusLabel(status?: string | null) {
  if (status === "PENDING") return "Pendiente por facturar";
  if (status === "INVOICED") return "Facturado";
  if (status === "PARTIALLY_PAID") return "Parcialmente pagado";
  if (status === "PAID") return "Pagado";
  if (status === "NOT_BILLABLE") return "No facturable";
  if (status === "BILLING_ERROR") return "Error de facturación";
  if (status === "CANCELLED") return "Cancelado";

  return status || undefined;
}

function formatWarrantyMonths(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return String(value);
}

export default function InstallationDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    installation,
    loading,
    error,
    creatingMaintenance,
    completingFollowUpId,
    deactivatingInstallation,
    actionMessage,
    handleCreateMaintenance,
    handleCompleteMaintenance,
    handleDeactivateInstallation,
  } = useInstallationDetail({ id });

  const latitude = useMemo(() => getLatitude(installation), [installation]);
  const longitude = useMemo(() => getLongitude(installation), [installation]);

  const hasLocationCoordinates = useMemo(
    () => hasCoordinates(latitude, longitude),
    [latitude, longitude],
  );

  const isInactive = installation?.is_active === false;

  const changeLogs = useMemo(() => {
    return installation?.change_logs ?? [];
  }, [installation]);

  const openStreetMapEmbedUrl = useMemo(
    () => getOpenStreetMapEmbedUrl(latitude, longitude),
    [latitude, longitude],
  );

  const googleMapsUrl = useMemo(
    () => getGoogleMapsUrl(latitude, longitude),
    [latitude, longitude],
  );

  const nextPendingFollowUp = useMemo(
    () => getNextPendingFollowUp(installation),
    [installation],
  );

  const technicianDisplayName = useMemo(() => {
    return getTechnicianDisplayName(
      installation?.technician,
      installation?.technician_name,
    );
  }, [installation?.technician, installation?.technician_name]);

  function handleEditInstallation() {
    if (!installation?.installation_id) return;
    window.location.href = `/installations/${installation.installation_id}/edit`;
  }

  if (loading) {
    return <main className="p-8">Cargando instalación...</main>;
  }

  if (error || !installation) {
    return <main className="p-8">{error || "Instalación no encontrada"}</main>;
  }

  const commercialInfo = installation as InstallationCommercialInfo;

  const clientFullName = getClientFullName(
    installation.client as ClientNameParts | null | undefined,
  );

  const estimatedAmount = formatCurrencyLabel(commercialInfo.estimated_amount);
  const costAmount = formatOptionalCurrencyLabel(commercialInfo.cost_amount);
  const finalAmount = formatOptionalCurrencyLabel(commercialInfo.final_amount);
  const billingStatusLabel = getBillingStatusLabel(
    commercialInfo.billing_status,
  );
  const billingNotes = commercialInfo.billing_notes || undefined;

  const locationLabel = `${installation.city || "-"}${
    installation.zone ? ` · ${installation.zone}` : ""
  }`;

  const warrantyMonths =
    installation.warranty_months !== null &&
    installation.warranty_months !== undefined
      ? String(installation.warranty_months)
      : "-";

  const warrantyCoverage = installation.warranty_end_date
    ? "Con fecha definida"
    : "-";

  const manualBackup =
    installation.technician_name && !installation.technician
      ? installation.technician_name
      : "-";

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <InstallationDetailHeader
          title={installation.description || "Instalación"}
          statusBadge={getInstallationStatusBadge(
            installation.installation_status,
          )}
          clientName={clientFullName || "Cliente no definido"}
          installationDate={formatDate(installation.installation_date)}
          location={locationLabel}
          amount={estimatedAmount}
          nextPendingFollowUpDate={
            nextPendingFollowUp?.target_date
              ? formatDate(nextPendingFollowUp.target_date)
              : null
          }
          creatingMaintenance={creatingMaintenance}
          isInactive={isInactive}
          deactivatingInstallation={deactivatingInstallation}
          onCreateMaintenance={handleCreateMaintenance}
          onEdit={handleEditInstallation}
          onDeactivate={handleDeactivateInstallation}
          onBack={() => window.history.back()}
        />

        <section className="grid grid-cols-1 gap-4 bg-slate-50 md:grid-cols-4">
          <MetricCard
            label="Servicio"
            value={installation.service_type?.name || "-"}
          />

          <StaffMetricCard
            label="Técnico"
            name={technicianDisplayName}
            role={installation.technician?.role}
            isActive={installation.technician?.is_active}
            isLinked={Boolean(installation.technician)}
          />

          <MetricCard
            label="Garantía"
            value={
              installation.warranty_months !== null &&
              installation.warranty_months !== undefined
                ? `${installation.warranty_months} meses`
                : "-"
            }
          />

          <MetricCard
            label="Seguimientos"
            value={String(installation.follow_ups?.length || 0)}
          />
        </section>

        <InstallationStatusAlerts
          actionMessage={actionMessage}
          isInactive={isInactive}
        />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <InstallationMainInfoSection
            installationDate={formatDate(installation.installation_date)}
            serviceTypeName={installation.service_type?.name || "-"}
            statusLabel={getInstallationStatusLabel(
              installation.installation_status,
            )}
            estimatedAmount={estimatedAmount}
            description={installation.description || "-"}
            costAmount={costAmount}
            finalAmount={finalAmount}
            billingStatusLabel={billingStatusLabel}
            billingNotes={billingNotes}
            warrantyMonths={formatWarrantyMonths(
              commercialInfo.warranty_months,
            )}
          />

          <InstallationClientSection
            clientId={installation.client?.client_id}
            clientName={clientFullName || "-"}
            phonePrimary={installation.client?.phone_primary}
            email={installation.client?.email}
          />
        </section>

        <InstallationTechnicianSection
          installationId={installation.installation_id}
          technicianDisplayName={technicianDisplayName}
          technicianRole={installation.technician?.role}
          technicianIsActive={installation.technician?.is_active}
          hasLinkedTechnician={Boolean(installation.technician)}
          warrantyMonths={warrantyMonths}
          warrantyEndDate={formatDate(installation.warranty_end_date)}
          coverage={warrantyCoverage}
          manualBackup={manualBackup}
        />

        <section>
          <Card title="🧩 Componentes de la instalación">
            <InstallationComponentsSection
              installationId={installation.installation_id}
            />
          </Card>
        </section>

        <section>
          <InstallationFilesSection
            installationId={installation.installation_id}
          />
        </section>

        <InstallationLocationDisplay
          zone={installation.zone}
          city={installation.city}
          address_line={installation.address_line}
          location_notes={installation.location_notes}
          reference_point={installation.reference_point}
          latitude={latitude}
          longitude={longitude}
          hasCoordinates={hasLocationCoordinates}
          openStreetMapEmbedUrl={openStreetMapEmbedUrl}
          googleMapsUrl={googleMapsUrl}
        />

        <InstallationChangeLogSection changeLogs={changeLogs} />

        <InstallationActivityHistorySection
          clientId={installation.client?.client_id}
          installationId={installation.installation_id}
        />

        <InstallationFollowUpsSection
          followUps={installation.follow_ups}
          isInactive={isInactive}
          completingFollowUpId={completingFollowUpId}
          onComplete={(followUpId) =>
            void handleCompleteMaintenance(followUpId)
          }
        />
      </div>
    </main>
  );
}
