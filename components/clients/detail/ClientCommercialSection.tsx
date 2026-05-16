"use client";

import type { CommercialSummary } from "@/lib/clients/clientDetail.types";
import {
  formatCurrency,
  formatDateLabel,
  getBillingStatusClass,
  getBillingStatusLabel,
} from "@/lib/clients/clientDetail.utils";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";
import { CommercialSummaryCard } from "@/components/clients/detail/CommercialSummaryCard";
import { MiniInfoCard } from "@/components/clients/detail/MiniInfoCard";

type ClientCommercialSectionProps = {
  commercialSummary: CommercialSummary;
  isOpen: boolean;
  onToggle: () => void;
};

export function ClientCommercialSection({
  commercialSummary,
  isOpen,
  onToggle,
}: ClientCommercialSectionProps) {
  return (
    <CollapsibleCard
      title="Resumen comercial"
      rightContent={
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {commercialSummary.items.length} trabajo
          {commercialSummary.items.length === 1 ? "" : "s"}
        </div>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <CommercialSummaryCard
          label="Total vendido"
          value={formatCurrency(commercialSummary.totalEstimated)}
          helper="Instalaciones y mantenimientos"
        />
        <CommercialSummaryCard
          label="Pendiente"
          value={formatCurrency(commercialSummary.pendingAmount)}
          helper="Pendiente por facturar"
        />
        <CommercialSummaryCard
          label="Facturado"
          value={formatCurrency(commercialSummary.invoicedAmount)}
          helper="Facturado o parcial"
        />
        <CommercialSummaryCard
          label="Pagado"
          value={formatCurrency(commercialSummary.paidAmount)}
          helper="Trabajos pagados"
        />
        <CommercialSummaryCard
          label="Costo interno"
          value={formatCurrency(commercialSummary.totalCost)}
          helper="Costo registrado"
        />
        <CommercialSummaryCard
          label="Utilidad estimada"
          value={formatCurrency(commercialSummary.profitAmount)}
          helper="Venta menos costo"
        />
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Trabajos recientes
          </h3>
        </div>

        {commercialSummary.recentItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              Aún no hay montos comerciales registrados para este cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {commercialSummary.recentItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.type === "INSTALLATION"
                          ? "Instalación"
                          : "Mantenimiento"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getBillingStatusClass(
                          item.billingStatus,
                        )}`}
                      >
                        {getBillingStatusLabel(item.billingStatus)}
                      </span>
                    </div>

                    <p className="truncate text-sm font-bold text-slate-900">
                      {item.description}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fecha: {formatDateLabel(item.date)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                    <MiniInfoCard
                      label="Monto"
                      value={formatCurrency(item.estimatedAmount)}
                    />
                    <MiniInfoCard
                      label="Costo"
                      value={formatCurrency(item.costAmount)}
                    />
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
