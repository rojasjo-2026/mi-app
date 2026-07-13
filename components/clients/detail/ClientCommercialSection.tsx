"use client";

import { BriefcaseBusiness } from "lucide-react";
import type { CommercialSummary } from "@/lib/clients/clientDetail.types";
import {
  formatCurrency,
  formatDateLabel,
  getBillingStatusClass,
  getBillingStatusLabel,
} from "@/lib/clients/clientDetail.utils";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";

type ClientCommercialSectionProps = {
  commercialSummary: CommercialSummary;
  isOpen: boolean;
  onToggle: () => void;
  currency?: string | null;
  locale?: string;
};

type CommercialMetricProps = {
  label: string;
  value: string;
  helper: string;
};

function CommercialMetric({ label, value, helper }: CommercialMetricProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1.5 text-lg font-semibold text-slate-950">{value}</p>

      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

export function ClientCommercialSection({
  commercialSummary,
  isOpen,
  onToggle,
  currency,
  locale,
}: ClientCommercialSectionProps) {
  const formatMoney = (value?: number | string | null) =>
    formatCurrency(value, currency, locale);

  const hasRecentItems = commercialSummary.recentItems.length > 0;

  return (
    <CollapsibleCard
      title="Resumen comercial operativo"
      description="Valor comercial de instalaciones y mantenimientos registrados."
      icon={<BriefcaseBusiness className="h-5 w-5" />}
      rightContent={
        <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
          {commercialSummary.items.length} trabajo
          {commercialSummary.items.length === 1 ? "" : "s"}
        </div>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <CommercialMetric
          label="Trabajos facturados"
          value={formatMoney(commercialSummary.invoicedAmount)}
          helper="Marcados como facturados"
        />

        <CommercialMetric
          label="Trabajos pagados"
          value={formatMoney(commercialSummary.paidAmount)}
          helper="Marcados como pagados"
        />

        <CommercialMetric
          label="Costo operativo"
          value={formatMoney(commercialSummary.totalCost)}
          helper="Costos registrados"
        />

        <CommercialMetric
          label="Utilidad estimada"
          value={formatMoney(commercialSummary.profitAmount)}
          helper="Valor neto estimado"
        />
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Trabajos operativos recientes
        </h3>

        {!hasRecentItems ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Sin trabajos comerciales registrados.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Cuando existan instalaciones o mantenimientos con montos,
              aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {commercialSummary.recentItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2.5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                        {item.type === "INSTALLATION"
                          ? "Instalación"
                          : "Mantenimiento"}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getBillingStatusClass(
                          item.billingStatus,
                        )}`}
                      >
                        {getBillingStatusLabel(item.billingStatus)}
                      </span>
                    </div>

                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.description || "Trabajo operativo"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateLabel(item.date, locale)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:min-w-[230px]">
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Monto
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatMoney(item.estimatedAmount)}
                      </p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Costo
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatMoney(item.costAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
