"use client";

import type {
  ClientInstallation,
  InstallationFilter,
} from "@/lib/clients/clientDetail.types";
import {
  formatCurrency,
  formatDateLabel,
  getBillingStatusClass,
  getBillingStatusLabel,
  getFilterButtonClass,
  getInstallationActiveBadgeClass,
  getInstallationActiveLabel,
  getInstallationStatusClass,
  getInstallationStatusLabel,
  getNextPendingFollowUp,
} from "@/lib/clients/clientDetail.utils";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";
import { MiniInfoCard } from "@/components/clients/detail/MiniInfoCard";

type ClientInstallationsSectionProps = {
  filteredInstallations: ClientInstallation[];
  installationSearch: string;
  installationFilter: InstallationFilter;
  isOpen: boolean;
  onToggle: () => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: InstallationFilter) => void;
  onInstallationClick: (installationId: string) => void;
};

export function ClientInstallationsSection({
  filteredInstallations,
  installationSearch,
  installationFilter,
  isOpen,
  onToggle,
  onSearchChange,
  onFilterChange,
  onInstallationClick,
}: ClientInstallationsSectionProps) {
  return (
    <CollapsibleCard
      title="Instalaciones"
      rightContent={
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {filteredInstallations.length} resultado
          {filteredInstallations.length === 1 ? "" : "s"}
        </div>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="mb-5 space-y-4">
        <input
          value={installationSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por descripción, servicio, ubicación o estado..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={getFilterButtonClass(installationFilter === "all")}
          >
            Todas
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("active")}
            className={getFilterButtonClass(installationFilter === "active")}
          >
            Activas
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("inactive")}
            className={getFilterButtonClass(installationFilter === "inactive")}
          >
            Inactivas
          </button>
        </div>

        <p className="text-sm text-slate-500">
          Mostrando {filteredInstallations.length} instalación
          {filteredInstallations.length === 1 ? "" : "es"}
        </p>
      </div>

      {filteredInstallations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No se encontraron instalaciones con los filtros actuales.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInstallations.map((item) => {
            const nextPendingFollowUp = getNextPendingFollowUp(item);
            const totalFollowUps = item.follow_ups?.length || 0;
            const completedFollowUps =
              item.follow_ups?.filter(
                (followUp) => followUp.follow_up_status?.code === "completed",
              ).length || 0;

            return (
              <div
                key={item.installation_id}
                onClick={() => onInstallationClick(item.installation_id)}
                className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold tracking-tight text-slate-900">
                        {item.description || "Instalación"}
                      </p>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInstallationStatusClass(
                          item.installation_status,
                        )}`}
                      >
                        {getInstallationStatusLabel(item.installation_status)}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInstallationActiveBadgeClass(
                          item.is_active,
                        )}`}
                      >
                        {getInstallationActiveLabel(item.is_active)}
                      </span>

                      {item.billing_status && (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBillingStatusClass(
                            item.billing_status,
                          )}`}
                        >
                          {getBillingStatusLabel(item.billing_status)}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <MiniInfoCard
                        label="Servicio"
                        value={item.service_type?.name || "-"}
                      />

                      <MiniInfoCard
                        label="Fecha de instalación"
                        value={formatDateLabel(item.installation_date)}
                      />

                      <MiniInfoCard
                        label="Monto"
                        value={formatCurrency(item.estimated_amount)}
                      />

                      <MiniInfoCard
                        label="Costo"
                        value={formatCurrency(item.cost_amount)}
                      />

                      <MiniInfoCard
                        label="Ubicación"
                        value={
                          item.city
                            ? `${item.city}${item.zone ? ` · ${item.zone}` : ""}`
                            : item.zone || item.address_line || "-"
                        }
                      />

                      <MiniInfoCard
                        label="Mantenimientos"
                        value={String(totalFollowUps)}
                      />

                      <MiniInfoCard
                        label="Completados"
                        value={String(completedFollowUps)}
                      />

                      <MiniInfoCard
                        label="Próximo mantenimiento"
                        value={
                          nextPendingFollowUp
                            ? formatDateLabel(nextPendingFollowUp.target_date)
                            : "-"
                        }
                      />

                      <MiniInfoCard
                        label="Motivo próximo"
                        value={
                          nextPendingFollowUp?.reason ||
                          "Sin mantenimiento pendiente"
                        }
                      />

                      <MiniInfoCard
                        label="Dirección"
                        value={item.address_line || "-"}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left lg:min-w-[150px] lg:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Ver detalle
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Instalación
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleCard>
  );
}
