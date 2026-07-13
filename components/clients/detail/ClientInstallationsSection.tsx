"use client";

import { Building2, Search } from "lucide-react";
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
  totalInstallationsCount: number;
  installationSearch: string;
  installationFilter: InstallationFilter;
  isOpen: boolean;
  onToggle: () => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: InstallationFilter) => void;
  onInstallationClick: (installationId: string) => void;
  onCreateInstallation: () => void;
  currency?: string | null;
  locale?: string;
};

function getInstallationLocation(item: ClientInstallation) {
  return (
    [item.city, item.zone].filter(Boolean).join(" · ") ||
    item.address_line ||
    "-"
  );
}

export function ClientInstallationsSection({
  filteredInstallations,
  totalInstallationsCount,
  installationSearch,
  installationFilter,
  isOpen,
  onToggle,
  onSearchChange,
  onFilterChange,
  onInstallationClick,
  onCreateInstallation,
  currency,
  locale,
}: ClientInstallationsSectionProps) {
  const hasInstallations = totalInstallationsCount > 0;
  const hasFilteredResults = filteredInstallations.length > 0;

  return (
    <CollapsibleCard
      title="Instalaciones"
      rightContent={
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
            {filteredInstallations.length} resultado
            {filteredInstallations.length === 1 ? "" : "s"}
          </div>

          <button
            type="button"
            onClick={onCreateInstallation}
            className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Crear instalación
          </button>
        </div>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {hasInstallations ? (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={installationSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por descripción, servicio, ubicación o estado..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
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
                className={getFilterButtonClass(
                  installationFilter === "active",
                )}
              >
                Activas
              </button>

              <button
                type="button"
                onClick={() => onFilterChange("inactive")}
                className={getFilterButtonClass(
                  installationFilter === "inactive",
                )}
              >
                Inactivas
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Mostrando {filteredInstallations.length} de{" "}
              {totalInstallationsCount} instalación
              {totalInstallationsCount === 1 ? "" : "es"}
            </p>
          </div>
        </div>
      ) : null}

      {!hasInstallations ? (
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 px-5 py-6">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
              <Building2 className="h-7 w-7" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-950">
                No hay instalaciones registradas
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Para este cliente primero debes registrar una instalación. Luego
                podrás programar mantenimientos y dar seguimiento operativo.
              </p>
            </div>

            <button
              type="button"
              onClick={onCreateInstallation}
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Crear primera instalación
            </button>
          </div>
        </div>
      ) : !hasFilteredResults ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-slate-600">
            No se encontraron instalaciones con los filtros actuales.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Ajusta la búsqueda o cambia el filtro para ver más resultados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInstallations.map((item) => {
            const nextPendingFollowUp = getNextPendingFollowUp(item);
            const totalFollowUps = item.follow_ups?.length || 0;
            const completedFollowUps =
              item.follow_ups?.filter(
                (followUp) => followUp.follow_up_status?.code === "completed",
              ).length || 0;

            return (
              <button
                key={item.installation_id}
                type="button"
                onClick={() => onInstallationClick(item.installation_id)}
                className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-slate-50/60 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold tracking-tight text-slate-900">
                        {item.description || "Instalación"}
                      </p>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getInstallationStatusClass(
                          item.installation_status,
                        )}`}
                      >
                        {getInstallationStatusLabel(item.installation_status)}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getInstallationActiveBadgeClass(
                          item.is_active,
                        )}`}
                      >
                        {getInstallationActiveLabel(item.is_active)}
                      </span>

                      {item.billing_status ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getBillingStatusClass(
                            item.billing_status,
                          )}`}
                        >
                          {getBillingStatusLabel(item.billing_status)}
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                      <MiniInfoCard
                        label="Servicio"
                        value={item.service_type?.name || "-"}
                      />

                      <MiniInfoCard
                        label="Fecha de instalación"
                        value={formatDateLabel(item.installation_date, locale)}
                      />

                      <MiniInfoCard
                        label="Monto"
                        value={formatCurrency(
                          item.estimated_amount,
                          currency,
                          locale,
                        )}
                      />

                      <MiniInfoCard
                        label="Costo"
                        value={formatCurrency(
                          item.cost_amount,
                          currency,
                          locale,
                        )}
                      />

                      <MiniInfoCard
                        label="Ubicación"
                        value={getInstallationLocation(item)}
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
                            ? formatDateLabel(
                                nextPendingFollowUp.target_date,
                                locale,
                              )
                            : "-"
                        }
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left lg:min-w-[125px] lg:text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Ver detalle
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Instalación
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </CollapsibleCard>
  );
}
