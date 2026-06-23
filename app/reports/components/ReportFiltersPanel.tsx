"use client";

import type {
  ActiveReportSource,
  ClientReportBuilderMetadata,
  FollowUpReportBuilderMetadata,
  InstallationReportBuilderMetadata,
  ReportFilters,
  ReportOption,
} from "../types";

type ReportFiltersPanelProps = {
  source: ActiveReportSource;
  filters: ReportFilters;
  clientMetadata: ClientReportBuilderMetadata | null;
  installationMetadata: InstallationReportBuilderMetadata | null;
  followUpMetadata: FollowUpReportBuilderMetadata | null;
  onFiltersChange: (filters: ReportFilters) => void;
};

type MetadataRecord = Record<string, unknown>;

function optionLabel(option: ReportOption) {
  if (typeof option.count === "number") {
    return `${option.label} (${option.count})`;
  }

  return option.label;
}

function getSearchPlaceholder(source: ActiveReportSource) {
  if (source === "clients") return "Cliente, teléfono, correo...";
  if (source === "installations")
    return "Cliente, servicio, técnico, ubicación...";

  return "Cliente, instalación, técnico, estado...";
}

function getMetadataOptions(
  metadata: FollowUpReportBuilderMetadata | null,
  keys: string[],
): ReportOption[] {
  if (!metadata) return [];

  const record = metadata as unknown as MetadataRecord;

  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value as ReportOption[];
    }
  }

  return [];
}

function getNestedMetadataOptions(
  metadata: FollowUpReportBuilderMetadata | null,
  parentKey: string,
  childKey: string,
): ReportOption[] {
  if (!metadata) return [];

  const record = metadata as unknown as MetadataRecord;
  const parent = record[parentKey];

  if (!parent || typeof parent !== "object") {
    return [];
  }

  const value = (parent as MetadataRecord)[childKey];

  if (Array.isArray(value)) {
    return value as ReportOption[];
  }

  return [];
}

function SelectField({
  label,
  value,
  options,
  onChange,
  extraOptions = [],
}: {
  label: string;
  value: string;
  options: ReportOption[];
  onChange: (value: string) => void;
  extraOptions?: ReportOption[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <option value="all">Todos</option>

        {extraOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {optionLabel(option)}
          </option>
        ))}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: "text" | "date" | "number";
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export default function ReportFiltersPanel({
  source,
  filters,
  clientMetadata,
  installationMetadata,
  followUpMetadata,
  onFiltersChange,
}: ReportFiltersPanelProps) {
  function updateFilter(key: keyof ReportFilters, value: string) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

  const followUpClients = getMetadataOptions(followUpMetadata, [
    "clients",
    "clientOptions",
  ]);

  const followUpInstallations = getMetadataOptions(followUpMetadata, [
    "installations",
    "installationOptions",
  ]);

  const followUpStatuses = getMetadataOptions(followUpMetadata, [
    "followUpStatuses",
    "statuses",
    "statusOptions",
  ]);

  const followUpTechnicians = getMetadataOptions(followUpMetadata, [
    "technicians",
    "technicianOptions",
  ]);

  const followUpOperationalZones = getMetadataOptions(followUpMetadata, [
    "operationalZones",
    "operationalZoneOptions",
  ]);

  const followUpBillingStatuses = getMetadataOptions(followUpMetadata, [
    "billingStatuses",
    "billingStatusOptions",
  ]);

  const followUpCompletionStatuses = getMetadataOptions(followUpMetadata, [
    "completionStatuses",
    "completionStatusOptions",
  ]);

  const followUpPendingBillingOptions =
    getNestedMetadataOptions(
      followUpMetadata,
      "booleanOptions",
      "pendingBilling",
    ).length > 0
      ? getNestedMetadataOptions(
          followUpMetadata,
          "booleanOptions",
          "pendingBilling",
        )
      : getMetadataOptions(followUpMetadata, ["pendingBillingOptions"]);

  const followUpContactFlows = getMetadataOptions(followUpMetadata, [
    "contactFlows",
    "contactFlowOptions",
  ]);

  const followUpContactAttempts = getMetadataOptions(followUpMetadata, [
    "contactAttempts",
    "contactAttemptOptions",
  ]);

  const followUpPriorities = getMetadataOptions(followUpMetadata, [
    "priorities",
    "priorityOptions",
  ]);

  const followUpMaintenanceTypes = getMetadataOptions(followUpMetadata, [
    "maintenanceTypes",
    "maintenanceTypeOptions",
  ]);

  const followUpCreatedFromSources = getMetadataOptions(followUpMetadata, [
    "createdFromSources",
    "createdSourceOptions",
    "sourceOptions",
  ]);

  const followUpCountries = getMetadataOptions(followUpMetadata, [
    "countries",
    "countryOptions",
  ]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Filtros
        </p>

        <h2 className="text-base font-semibold tracking-tight text-slate-950">
          Refinar reporte
        </h2>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextField
          label="Búsqueda"
          value={filters.search}
          placeholder={getSearchPlaceholder(source)}
          onChange={(value) => updateFilter("search", value)}
        />

        {source === "clients" && clientMetadata && (
          <>
            <SelectField
              label="Tipo de cliente"
              value={filters.clientType}
              options={clientMetadata.clientTypes}
              onChange={(value) => updateFilter("clientType", value)}
            />

            <SelectField
              label="Estado"
              value={filters.status}
              options={clientMetadata.clientStatuses}
              onChange={(value) => updateFilter("status", value)}
            />

            <SelectField
              label="WhatsApp"
              value={filters.whatsapp}
              options={clientMetadata.booleanOptions.whatsapp}
              onChange={(value) => updateFilter("whatsapp", value)}
            />

            <SelectField
              label="Contacto automático"
              value={filters.autoContact}
              options={clientMetadata.booleanOptions.autoContact}
              onChange={(value) => updateFilter("autoContact", value)}
            />

            <SelectField
              label="Exento"
              value={filters.taxExempt}
              options={clientMetadata.booleanOptions.taxExempt}
              onChange={(value) => updateFilter("taxExempt", value)}
            />

            <SelectField
              label="País"
              value={filters.countryCode}
              options={clientMetadata.countries}
              onChange={(value) => updateFilter("countryCode", value)}
            />

            <SelectField
              label="Provincia / Región"
              value={filters.adminLevel1}
              options={clientMetadata.adminLevel1Options}
              onChange={(value) => updateFilter("adminLevel1", value)}
            />

            <SelectField
              label="Cantón / Ciudad"
              value={filters.adminLevel2}
              options={clientMetadata.adminLevel2Options}
              onChange={(value) => updateFilter("adminLevel2", value)}
            />

            <SelectField
              label="Distrito / Zona"
              value={filters.adminLevel3}
              options={clientMetadata.adminLevel3Options}
              onChange={(value) => updateFilter("adminLevel3", value)}
            />

            <SelectField
              label="Zona operativa"
              value={filters.operationalZoneId}
              options={clientMetadata.operationalZones}
              extraOptions={[
                {
                  value: "without",
                  label: "Sin zona operativa",
                  count: clientMetadata.counters.withoutOperationalZoneCount,
                },
              ]}
              onChange={(value) => updateFilter("operationalZoneId", value)}
            />

            <SelectField
              label="Condición de pago"
              value={filters.paymentTerm}
              options={clientMetadata.paymentTerms}
              onChange={(value) => updateFilter("paymentTerm", value)}
            />

            <SelectField
              label="Moneda"
              value={filters.preferredCurrency}
              options={clientMetadata.currencies}
              onChange={(value) => updateFilter("preferredCurrency", value)}
            />
          </>
        )}

        {source === "installations" && installationMetadata && (
          <>
            <SelectField
              label="Cliente"
              value={filters.clientId}
              options={installationMetadata.clients}
              onChange={(value) => updateFilter("clientId", value)}
            />

            <SelectField
              label="Tipo de servicio"
              value={filters.serviceTypeId}
              options={installationMetadata.serviceTypes}
              onChange={(value) => updateFilter("serviceTypeId", value)}
            />

            <SelectField
              label="Técnico"
              value={filters.technicianId}
              options={installationMetadata.technicians}
              extraOptions={[
                {
                  value: "without",
                  label: "Sin técnico asignado",
                  count: installationMetadata.counters.withoutTechnicianCount,
                },
              ]}
              onChange={(value) => updateFilter("technicianId", value)}
            />

            <SelectField
              label="Estado instalación"
              value={filters.installationStatus}
              options={installationMetadata.installationStatuses}
              onChange={(value) => updateFilter("installationStatus", value)}
            />

            <SelectField
              label="Estado facturación"
              value={filters.billingStatus}
              options={installationMetadata.billingStatuses}
              onChange={(value) => updateFilter("billingStatus", value)}
            />

            <SelectField
              label="Activa"
              value={filters.isActive}
              options={installationMetadata.booleanOptions.isActive}
              onChange={(value) => updateFilter("isActive", value)}
            />

            <SelectField
              label="Facturación pendiente"
              value={filters.pendingBilling}
              options={installationMetadata.booleanOptions.pendingBilling}
              onChange={(value) => updateFilter("pendingBilling", value)}
            />

            <SelectField
              label="Mantenimiento pendiente"
              value={filters.pendingMaintenance}
              options={installationMetadata.booleanOptions.pendingMaintenance}
              onChange={(value) => updateFilter("pendingMaintenance", value)}
            />

            <SelectField
              label="País"
              value={filters.countryCode}
              options={installationMetadata.countries}
              onChange={(value) => updateFilter("countryCode", value)}
            />

            <SelectField
              label="Provincia / Región"
              value={filters.adminLevel1}
              options={installationMetadata.adminLevel1Options}
              onChange={(value) => updateFilter("adminLevel1", value)}
            />

            <SelectField
              label="Cantón / Ciudad"
              value={filters.adminLevel2}
              options={installationMetadata.adminLevel2Options}
              onChange={(value) => updateFilter("adminLevel2", value)}
            />

            <SelectField
              label="Distrito / Zona"
              value={filters.adminLevel3}
              options={installationMetadata.adminLevel3Options}
              onChange={(value) => updateFilter("adminLevel3", value)}
            />

            <SelectField
              label="Ciudad"
              value={filters.city}
              options={installationMetadata.cityOptions}
              onChange={(value) => updateFilter("city", value)}
            />

            <SelectField
              label="Zona"
              value={filters.zone}
              options={installationMetadata.zoneOptions}
              onChange={(value) => updateFilter("zone", value)}
            />

            <SelectField
              label="Zona operativa"
              value={filters.operationalZoneId}
              options={installationMetadata.operationalZones}
              extraOptions={[
                {
                  value: "without",
                  label: "Sin zona operativa",
                  count:
                    installationMetadata.counters.withoutOperationalZoneCount,
                },
              ]}
              onChange={(value) => updateFilter("operationalZoneId", value)}
            />

            <TextField
              label="Monto estimado mínimo"
              type="number"
              value={filters.minEstimatedAmount}
              onChange={(value) => updateFilter("minEstimatedAmount", value)}
            />

            <TextField
              label="Monto estimado máximo"
              type="number"
              value={filters.maxEstimatedAmount}
              onChange={(value) => updateFilter("maxEstimatedAmount", value)}
            />

            <TextField
              label="Instalación desde"
              type="date"
              value={filters.installationFrom}
              onChange={(value) => updateFilter("installationFrom", value)}
            />

            <TextField
              label="Instalación hasta"
              type="date"
              value={filters.installationTo}
              onChange={(value) => updateFilter("installationTo", value)}
            />

            <TextField
              label="Garantía desde"
              type="date"
              value={filters.warrantyFrom}
              onChange={(value) => updateFilter("warrantyFrom", value)}
            />

            <TextField
              label="Garantía hasta"
              type="date"
              value={filters.warrantyTo}
              onChange={(value) => updateFilter("warrantyTo", value)}
            />
          </>
        )}

        {source === "follow-ups" && (
          <>
            <SelectField
              label="Cliente"
              value={filters.clientId}
              options={followUpClients}
              onChange={(value) => updateFilter("clientId", value)}
            />

            <SelectField
              label="Instalación"
              value={filters.installationId}
              options={followUpInstallations}
              onChange={(value) => updateFilter("installationId", value)}
            />

            <SelectField
              label="Estado mantenimiento"
              value={filters.followUpStatusId}
              options={followUpStatuses}
              onChange={(value) => updateFilter("followUpStatusId", value)}
            />

            <SelectField
              label="Técnico"
              value={filters.technicianId}
              options={followUpTechnicians}
              onChange={(value) => updateFilter("technicianId", value)}
            />

            <SelectField
              label="Zona operativa"
              value={filters.operationalZoneId}
              options={followUpOperationalZones}
              onChange={(value) => updateFilter("operationalZoneId", value)}
            />

            <SelectField
              label="Estado facturación"
              value={filters.billingStatus}
              options={followUpBillingStatuses}
              onChange={(value) => updateFilter("billingStatus", value)}
            />

            <SelectField
              label="Estado de cierre"
              value={filters.completionStatus}
              options={followUpCompletionStatuses}
              onChange={(value) => updateFilter("completionStatus", value)}
            />

            <SelectField
              label="Facturación pendiente"
              value={filters.pendingBilling}
              options={followUpPendingBillingOptions}
              onChange={(value) => updateFilter("pendingBilling", value)}
            />

            <SelectField
              label="Flujo de contacto"
              value={filters.contactFlow}
              options={followUpContactFlows}
              onChange={(value) => updateFilter("contactFlow", value)}
            />

            <SelectField
              label="Intentos de contacto"
              value={filters.contactAttempts}
              options={followUpContactAttempts}
              onChange={(value) => updateFilter("contactAttempts", value)}
            />

            <SelectField
              label="Prioridad"
              value={filters.priority}
              options={followUpPriorities}
              onChange={(value) => updateFilter("priority", value)}
            />

            <SelectField
              label="Tipo de mantenimiento"
              value={filters.maintenanceType}
              options={followUpMaintenanceTypes}
              onChange={(value) => updateFilter("maintenanceType", value)}
            />

            <SelectField
              label="Origen"
              value={filters.createdFromSource}
              options={followUpCreatedFromSources}
              onChange={(value) => updateFilter("createdFromSource", value)}
            />

            <SelectField
              label="País"
              value={filters.countryCode}
              options={followUpCountries}
              onChange={(value) => updateFilter("countryCode", value)}
            />

            <TextField
              label="Monto estimado mínimo"
              type="number"
              value={filters.minEstimatedAmount}
              onChange={(value) => updateFilter("minEstimatedAmount", value)}
            />

            <TextField
              label="Monto estimado máximo"
              type="number"
              value={filters.maxEstimatedAmount}
              onChange={(value) => updateFilter("maxEstimatedAmount", value)}
            />

            <TextField
              label="Objetivo desde"
              type="date"
              value={filters.targetFrom}
              onChange={(value) => updateFilter("targetFrom", value)}
            />

            <TextField
              label="Objetivo hasta"
              type="date"
              value={filters.targetTo}
              onChange={(value) => updateFilter("targetTo", value)}
            />

            <TextField
              label="Vence desde"
              type="date"
              value={filters.dueFrom}
              onChange={(value) => updateFilter("dueFrom", value)}
            />

            <TextField
              label="Vence hasta"
              type="date"
              value={filters.dueTo}
              onChange={(value) => updateFilter("dueTo", value)}
            />

            <TextField
              label="Programado desde"
              type="date"
              value={filters.scheduledFrom}
              onChange={(value) => updateFilter("scheduledFrom", value)}
            />

            <TextField
              label="Programado hasta"
              type="date"
              value={filters.scheduledTo}
              onChange={(value) => updateFilter("scheduledTo", value)}
            />

            <TextField
              label="Completado desde"
              type="date"
              value={filters.completedFrom}
              onChange={(value) => updateFilter("completedFrom", value)}
            />

            <TextField
              label="Completado hasta"
              type="date"
              value={filters.completedTo}
              onChange={(value) => updateFilter("completedTo", value)}
            />
          </>
        )}

        <TextField
          label="Creado desde"
          type="date"
          value={filters.createdFrom}
          onChange={(value) => updateFilter("createdFrom", value)}
        />

        <TextField
          label="Creado hasta"
          type="date"
          value={filters.createdTo}
          onChange={(value) => updateFilter("createdTo", value)}
        />

        <TextField
          label="Actualizado desde"
          type="date"
          value={filters.updatedFrom}
          onChange={(value) => updateFilter("updatedFrom", value)}
        />

        <TextField
          label="Actualizado hasta"
          type="date"
          value={filters.updatedTo}
          onChange={(value) => updateFilter("updatedTo", value)}
        />
      </div>
    </section>
  );
}
