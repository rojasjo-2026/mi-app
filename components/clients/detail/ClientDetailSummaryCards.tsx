"use client";

import type { ClientNextMaintenance } from "@/lib/clients/clientInstallations.utils";
import { formatDateLabel } from "@/lib/clients/clientDetail.utils";
import { SummaryCard } from "@/components/clients/detail/SummaryCard";

type ClientDetailSummaryCardsProps = {
  installationsCount: number;
  totalMaintenances: number;
  completedMaintenancesCount: number;
  nextMaintenance: ClientNextMaintenance | null;
};

export function ClientDetailSummaryCards({
  installationsCount,
  totalMaintenances,
  completedMaintenancesCount,
  nextMaintenance,
}: ClientDetailSummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Instalaciones"
        value={String(installationsCount)}
        helper="Total registradas"
      />

      <SummaryCard
        label="Mantenimientos"
        value={String(totalMaintenances)}
        helper="Total asociados"
      />

      <SummaryCard
        label="Completados"
        value={String(completedMaintenancesCount)}
        helper="Historial cerrado"
      />

      <SummaryCard
        label="Próximo"
        value={
          nextMaintenance ? formatDateLabel(nextMaintenance.target_date) : "-"
        }
        helper={
          nextMaintenance
            ? nextMaintenance.installation?.description ||
              nextMaintenance.reason ||
              "Mantenimiento programado"
            : "Sin próximos mantenimientos"
        }
      />
    </section>
  );
}
