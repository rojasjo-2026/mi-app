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
  currency?: string | null;
  locale?: string;
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
    border: "hover:border-blue-200",
  },
  orange: {
    icon: "bg-orange-50 text-orange-600",
    border: "hover:border-orange-200",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    border: "hover:border-emerald-200",
  },
  purple: {
    icon: "bg-violet-50 text-violet-600",
    border: "hover:border-violet-200",
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
      className={`group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>

          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-500">
            {helper}
          </p>
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
  currency,
  locale,
}: ClientDetailSummaryCardsProps) {
  const hasInstallations = installationsCount > 0;

  const nextMaintenanceValue = !hasInstallations
    ? "Requiere instalación"
    : nextMaintenance
      ? formatDateLabel(nextMaintenance.target_date, locale)
      : "Sin programar";

  const nextMaintenanceHelper = !hasInstallations
    ? "Primero registra una instalación"
    : nextMaintenance
      ? nextMaintenance.installation?.description ||
        nextMaintenance.reason ||
        "Mantenimiento programado"
      : "Sin próximos mantenimientos";

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
        helper={hasInstallations ? "Total asociados" : "Sin instalación base"}
        icon={<Wrench className="h-6 w-6" />}
        tone="orange"
      />

      <SummaryMetricCard
        label="Saldo pendiente"
        value={formatCurrency(pendingBalance, currency, locale)}
        helper={getPendingBalanceHelper(pendingInvoiceCount)}
        icon={<CircleDollarSign className="h-6 w-6" />}
        tone="green"
      />

      <SummaryMetricCard
        label="Próximo mantenimiento"
        value={nextMaintenanceValue}
        helper={nextMaintenanceHelper}
        icon={<CalendarClock className="h-6 w-6" />}
        tone="purple"
      />
    </section>
  );
}
