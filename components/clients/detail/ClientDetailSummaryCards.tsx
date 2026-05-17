"use client";

import type { ClientNextMaintenance } from "@/lib/clients/clientInstallations.utils";
import {
  formatCurrency,
  formatDateLabel,
} from "@/lib/clients/clientDetail.utils";
import { SummaryCard } from "@/components/clients/detail/SummaryCard";

type ClientDetailSummaryCardsProps = {
  installationsCount: number;
  totalMaintenances: number;
  pendingBalance: number;
  pendingInvoiceCount: number;
  nextMaintenance: ClientNextMaintenance | null;
};

function getPendingBalanceHelper(pendingInvoiceCount: number) {
  if (pendingInvoiceCount <= 0) {
    return "Sin saldo pendiente";
  }

  return `${pendingInvoiceCount} factura${
    pendingInvoiceCount === 1 ? "" : "s"
  } pendiente${pendingInvoiceCount === 1 ? "" : "s"}`;
}

export function ClientDetailSummaryCards({
  installationsCount,
  totalMaintenances,
  pendingBalance,
  pendingInvoiceCount,
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
        label="Saldo pendiente"
        value={formatCurrency(pendingBalance)}
        helper={getPendingBalanceHelper(pendingInvoiceCount)}
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
