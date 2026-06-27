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
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
            {filteredInstallations.length} resultado
            {filteredInstallations.length === 1 ? "" : "s"}
          </div>

          <button
            type="button"
            onClick={onCreateInstallation}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            + Crear instalación
          </button>
        </div>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {hasInstallations ? (
        <div className="mb-5 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={installationSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por descripción, servicio, ubicación o estado..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
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

            <p className="text-sm font-medium text-slate-500">
              Mostrando {filteredInstallations.length} de{" "}
              {totalInstallationsCount} instalación
              {totalInstallationsCount === 1 ? "" : "es"}
            </p>
          </div>
        </div>
      ) : null}

      {!hasInstallations ? (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-8">
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white text-blue-600 shadow-sm">
              <Building2 className="h-10 w-10" />
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-950">
                No hay instalaciones registradas
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Para este cliente primero debes registrar una instalación. Luego
                podrás programar mantenimientos y dar seguimiento operativo.
              </p>
            </div>

            <button
              type="button"
              onClick={onCreateInstallation}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Crear primera instalación
            </button>
          </div>
        </div>
      ) : !hasFilteredResults ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-6 text-center">
          <p className="text-sm font-semibold text-slate-600">
            No se encontraron instalaciones con los filtros actuales.
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Ajusta la búsqueda o cambia el filtro para ver más resultados.
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
              <button
                key={item.installation_id}
                type="button"
                onClick={() => onInstallationClick(item.installation_id)}
                className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50/60 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black tracking-tight text-slate-900">
                        {item.description || "Instalación"}
                      </p>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getInstallationStatusClass(
                          item.installation_status,
                        )}`}
                      >
                        {getInstallationStatusLabel(item.installation_status)}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getInstallationActiveBadgeClass(
                          item.is_active,
                        )}`}
                      >
                        {getInstallationActiveLabel(item.is_active)}
                      </span>

                      {item.billing_status ? (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getBillingStatusClass(
                            item.billing_status,
                          )}`}
                        >
                          {getBillingStatusLabel(item.billing_status)}
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left lg:min-w-[150px] lg:text-right">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Ver detalle
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
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
