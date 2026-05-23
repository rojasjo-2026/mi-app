"use client";

import { useEffect, useMemo, useState } from "react";
import FinanceInvoiceDraftForm from "@/components/finance/FinanceInvoiceDraftForm";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
} from "@/lib/settings/countryPresets";
import type { PendingBillable, PendingBillablesResponse } from "../types";
import {
  formatCurrency,
  formatDateLabel,
  getBillingStatusClass,
  getBillingStatusLabel,
  toSafeNumber,
} from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import MiniAmountCard from "./MiniAmountCard";
import SectionHeader from "./SectionHeader";

type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
    default_currency?: string | null;
  } | null;
};

const DEFAULT_COUNTRY_CODE = "CR";

const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? Object.values(COUNTRY_PRESETS)[0];

function getBusinessCountryMeta(settings?: AppSettingsResponse["data"]) {
  const countryPreset =
    getCountryPreset(settings?.country_code) ?? fallbackCountryPreset;

  return {
    currency: settings?.default_currency || countryPreset.primaryCurrency,
    locale: countryPreset.locale,
  };
}

type PendingBillablesSectionProps = {
  items: PendingBillable[];
  summary?: PendingBillablesResponse["summary"];
  loading: boolean;
  error: string;
  search: string;
  status: string;
  selectedBillable: PendingBillable | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  onSelectBillable: (item: PendingBillable) => void;
  onClearSelection: () => void;
  onInvoiceCreated: () => void;
};

export default function PendingBillablesSection({
  items,
  summary,
  loading,
  error,
  search,
  status,
  selectedBillable,
  onSearchChange,
  onStatusChange,
  onRefresh,
  onSelectBillable,
  onClearSelection,
  onInvoiceCreated,
}: PendingBillablesSectionProps) {
  const defaultBusinessMeta = useMemo(() => getBusinessCountryMeta(), []);
  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessSettings() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        const result: AppSettingsResponse = await response.json();

        if (!response.ok || !result.success) {
          return;
        }

        const businessMeta = getBusinessCountryMeta(result.data);

        if (!isMounted) return;

        setBusinessCurrency(businessMeta.currency);
        setBusinessLocale(businessMeta.locale);
      } catch {
        // Keep default business metadata if settings cannot be loaded.
      }
    }

    void loadBusinessSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Trabajos pendientes"
          title="Trabajos pendientes para facturar"
          description="Instalaciones y mantenimientos con estado comercial pendiente."
        />

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FinanceSummaryCard
          label="Trabajos"
          value={String(summary?.count ?? items.length)}
          helper="Listos para revisar"
        />

        <FinanceSummaryCard
          label="Monto estimado"
          value={formatCurrency(
            summary?.total_amount ?? 0,
            businessCurrency,
            businessLocale,
          )}
          helper="Total pendiente"
        />

        <FinanceSummaryCard
          label="Utilidad estimada"
          value={formatCurrency(
            summary?.estimated_profit ?? 0,
            businessCurrency,
            businessLocale,
          )}
          helper="Monto menos costo"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_140px]">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por cliente, teléfono, cédula o descripción del trabajo..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="ALL">Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="INVOICED">Facturado</option>
          <option value="PARTIALLY_PAID">Parcialmente pagado</option>
          <option value="PAID">Pagado</option>
          <option value="NOT_BILLABLE">No facturable</option>
          <option value="BILLING_ERROR">Error de facturación</option>
          <option value="CANCELLED">Cancelado</option>
        </select>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buscar
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {selectedBillable && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Facturar trabajo seleccionado
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedBillable.client_name} · {selectedBillable.description}
              </p>
            </div>

            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>

          <FinanceInvoiceDraftForm
            client={selectedBillable.client}
            installationId={
              selectedBillable.type === "INSTALLATION"
                ? selectedBillable.installation_id
                : null
            }
            followUpId={
              selectedBillable.type === "FOLLOW_UP"
                ? selectedBillable.follow_up_id
                : null
            }
            sourceType={selectedBillable.type}
            serviceDescription={selectedBillable.description}
            estimatedAmount={selectedBillable.estimated_amount}
            finalAmount={selectedBillable.final_amount}
            onInvoiceCreated={onInvoiceCreated}
          />
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando trabajos pendientes...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No hay trabajos pendientes para facturar con los filtros actuales.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.source_label ||
                        (item.type === "INSTALLATION"
                          ? "Instalación"
                          : "Mantenimiento")}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getBillingStatusClass(
                        item.billing_status,
                      )}`}
                    >
                      {getBillingStatusLabel(item.billing_status)}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900">
                    {item.client_name || "-"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.description || "-"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Teléfono: {item.client_phone || "-"} · Fecha:{" "}
                    {formatDateLabel(item.date, businessLocale)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                  <MiniAmountCard
                    label="Monto"
                    value={formatCurrency(
                      toSafeNumber(item.final_amount) > 0
                        ? item.final_amount
                        : item.estimated_amount,
                      businessCurrency,
                      businessLocale,
                    )}
                  />

                  <MiniAmountCard
                    label="Costo"
                    value={formatCurrency(
                      item.cost_amount,
                      businessCurrency,
                      businessLocale,
                    )}
                  />

                  <button
                    type="button"
                    onClick={() => onSelectBillable(item)}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Generar factura
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
