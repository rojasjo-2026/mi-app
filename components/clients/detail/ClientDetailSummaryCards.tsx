"use client";

import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Wrench,
} from "lucide-react";
import type { ClientNextMaintenance } from "@/lib/clients/clientInstallations.utils";
import {
  formatCurrency,
  formatDateLabel,
} from "@/lib/clients/clientDetail.utils";

type ClientDetailSummaryCardsProps = {
  installationsCount: number;
  totalMaintenances: number;
  pendingBalance: number;
  pendingInvoiceCount: number;
  nextMaintenance: ClientNextMaintenance | null;
};

type SummaryMetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  tone: "blue" | "orange" | "green" | "purple";
};

const toneClasses = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    ring: "hover:border-blue-200 hover:shadow-blue-100/70",
  },
  orange: {
    icon: "bg-orange-50 text-orange-600",
    ring: "hover:border-orange-200 hover:shadow-orange-100/70",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    ring: "hover:border-emerald-200 hover:shadow-emerald-100/70",
  },
  purple: {
    icon: "bg-violet-50 text-violet-600",
    ring: "hover:border-violet-200 hover:shadow-violet-100/70",
  },
};

function getPendingBalanceHelper(pendingInvoiceCount: number) {
  if (pendingInvoiceCount <= 0) {
    return "Sin saldo pendiente";
  }

  return `${pendingInvoiceCount} factura${
    pendingInvoiceCount === 1 ? "" : "s"
  } pendiente${pendingInvoiceCount === 1 ? "" : "s"}`;
}

function SummaryMetricCard({
  label,
  value,
  helper,
  icon,
  tone,
}: SummaryMetricCardProps) {
  const styles = toneClasses[tone];

  return (
    <article
      className={`group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles.ring}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-500">{label}</p>

          <div className="space-y-1">
            <p className="text-3xl font-extrabold tracking-tight text-slate-950">
              {value}
            </p>

            <p className="line-clamp-2 text-sm font-medium text-slate-500">
              {helper}
            </p>
          </div>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}
        >
          {icon}
        </div>
      </div>
    </article>
  );
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
      <SummaryMetricCard
        label="Instalaciones"
        value={String(installationsCount)}
        helper="Total registradas"
        icon={<ClipboardList className="h-6 w-6" />}
        tone="blue"
      />

      <SummaryMetricCard
        label="Mantenimientos"
        value={String(totalMaintenances)}
        helper="Total asociados"
        icon={<Wrench className="h-6 w-6" />}
        tone="orange"
      />

      <SummaryMetricCard
        label="Saldo pendiente"
        value={formatCurrency(pendingBalance)}
        helper={getPendingBalanceHelper(pendingInvoiceCount)}
        icon={<CircleDollarSign className="h-6 w-6" />}
        tone="green"
      />

      <SummaryMetricCard
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
        icon={<CalendarClock className="h-6 w-6" />}
        tone="purple"
      />
    </section>
  );
}
