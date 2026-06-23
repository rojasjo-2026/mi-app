"use client";

import type {
  ActiveReportSource,
  ClientReportBuilderMetadata,
  InstallationReportBuilderMetadata,
  ReportFilters,
  ReportOption,
} from "../types";

type ReportFiltersPanelProps = {
  source: ActiveReportSource;
  filters: ReportFilters;
  clientMetadata: ClientReportBuilderMetadata | null;
  installationMetadata: InstallationReportBuilderMetadata | null;
  onFiltersChange: (filters: ReportFilters) => void;
};

function optionLabel(option: ReportOption) {
  if (typeof option.count === "number") {
    return `${option.label} (${option.count})`;
  }

  return option.label;
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
  onFiltersChange,
}: ReportFiltersPanelProps) {
  function updateFilter(key: keyof ReportFilters, value: string) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

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
          placeholder={
            source === "clients"
              ? "Cliente, teléfono, correo..."
              : "Cliente, servicio, técnico, ubicación..."
          }
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
