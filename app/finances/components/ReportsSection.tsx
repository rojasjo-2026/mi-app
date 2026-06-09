"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
} from "@/lib/settings/countryPresets";
import { formatCurrency } from "../utils";
import SectionHeader from "./SectionHeader";

type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
    default_currency?: string | null;
  } | null;
};

type FinanceTrendPoint = {
  label: string;
  invoiced: number;
  paid: number;
  pending: number;
  cost: number;
  profit: number;
};

type InvoiceStatusBreakdown = {
  paid: number;
  pending: number;
  overdue: number;
  partial: number;
  cancelled: number;
};

type FinanceDashboardData = {
  currency?: string | null;
  period: {
    dateFrom: string;
    dateTo: string;
  };
  billing: {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalCancelled: number;
    invoiceCount: number;
    paidInvoiceCount: number;
    openInvoiceCount: number;
    overdueInvoiceCount: number;
    cancelledInvoiceCount: number;
  };
  pendingBillables: {
    count: number;
    totalAmount: number;
    totalCost: number;
    estimatedProfit: number;
  };
  indicators: {
    potentialTotal: number;
    collectionRate: number;
    overdueRate: number;
    estimatedMargin: number;
  };
  previousPeriod?: {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    pendingBillablesAmount: number;
    estimatedProfit: number;
    potentialTotal: number;
  };
  trends: FinanceTrendPoint[];
  invoiceStatus: InvoiceStatusBreakdown;
};

type FinanceDashboardResponse = {
  success: boolean;
  message?: string;
  data?: FinanceDashboardData;
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

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    dateFrom: toDateInputValue(start),
    dateTo: toDateInputValue(end),
  };
}

function formatPercent(value?: number | null) {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) return "0.0%";

  return `${numberValue.toFixed(1)}%`;
}

function getChange(current: number, previous?: number | null) {
  const safeCurrent = Number(current || 0);
  const safePrevious = Number(previous || 0);

  if (!safePrevious) return null;

  return ((safeCurrent - safePrevious) / Math.abs(safePrevious)) * 100;
}

function ChangeLabel({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-[11px] font-medium text-slate-400">
        Sin comparación anterior
      </span>
    );
  }

  const isPositive = value >= 0;

  return (
    <span
      className={`text-[11px] font-semibold ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {isPositive ? "↑" : "↓"} {Math.abs(value).toFixed(1)}% vs periodo anterior
    </span>
  );
}

function DashboardCard({
  label,
  value,
  helper,
  change,
}: {
  label: string;
  value: string;
  helper: string;
  change?: number | null;
}) {
  return (
    <article className="min-h-[118px] rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2.5 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>

      <div className="mt-2.5">
        <ChangeLabel value={change ?? null} />
      </div>
    </article>
  );
}

function CompactMetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
    </article>
  );
}

function SimpleBarChart({
  data,
  currency,
  locale,
}: {
  data: FinanceTrendPoint[];
  currency: string;
  locale: string;
}) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [item.paid, item.cost]),
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Ingresos vs costos
        </p>

        <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" />
            Ingresos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-200" />
            Costos
          </span>
        </div>
      </div>

      <div className="mt-4 flex h-56 items-end gap-4 rounded-md bg-slate-50 px-4 pb-4 pt-5">
        {data.map((item) => {
          const paidHeight = Math.max(6, (item.paid / maxValue) * 170);
          const costHeight = Math.max(6, (item.cost / maxValue) * 170);

          return (
            <div
              key={item.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-[175px] items-end gap-1">
                <div
                  title={`Pagado: ${formatCurrency(item.paid, currency, locale)}`}
                  className="w-5 rounded-t-md bg-emerald-200"
                  style={{ height: `${paidHeight}px` }}
                />
                <div
                  title={`Costo: ${formatCurrency(item.cost, currency, locale)}`}
                  className="w-5 rounded-t-md bg-red-200"
                  style={{ height: `${costHeight}px` }}
                />
              </div>

              <span className="truncate text-xs font-semibold text-slate-500">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SimpleLineChart({
  data,
  currency,
  locale,
}: {
  data: FinanceTrendPoint[];
  currency: string;
  locale: string;
}) {
  const width = 520;
  const height = 190;
  const padding = 24;
  const maxValue = Math.max(1, ...data.map((item) => item.invoiced));
  const denominator = Math.max(1, data.length - 1);

  const points = data.map((item, index) => {
    const x = padding + ((width - padding * 2) / denominator) * index;
    const y =
      height - padding - (item.invoiced / maxValue) * (height - padding * 2);

    return { ...item, x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Facturación mensual
      </p>

      <div className="mt-4 overflow-hidden rounded-md bg-slate-50 px-4 pb-3 pt-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full"
          role="img"
          aria-label="Facturación mensual"
        >
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-blue-500"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point) => (
            <g key={point.label}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                className="fill-blue-500"
              />
              <title>
                {point.label}:{" "}
                {formatCurrency(point.invoiced, currency, locale)}
              </title>
            </g>
          ))}
        </svg>

        <div className="grid grid-cols-6 gap-2 text-center text-xs font-semibold text-slate-500">
          {data.map((item) => (
            <span key={item.label} className="truncate">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatusDonut({ status }: { status: InvoiceStatusBreakdown }) {
  const total =
    status.paid +
    status.pending +
    status.overdue +
    status.partial +
    status.cancelled;
  const paidPercent = total ? Math.round((status.paid / total) * 100) : 0;
  const pendingPercent = total ? Math.round((status.pending / total) * 100) : 0;
  const overduePercent = total ? Math.round((status.overdue / total) * 100) : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Estado de facturas
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-[160px_1fr] md:items-center">
        <div className="relative mx-auto h-36 w-36 rounded-full bg-amber-200">
          <div className="absolute inset-6 rounded-full bg-white" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-slate-500">Total</span>
            <span className="text-xl font-semibold text-slate-950">
              {total}
            </span>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-slate-600">Pagadas</span>
            <span className="font-semibold text-emerald-700">
              {status.paid} ({paidPercent}%)
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-slate-600">Pendientes</span>
            <span className="font-semibold text-amber-700">
              {status.pending + status.partial} ({pendingPercent}%)
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-slate-600">Vencidas</span>
            <span className="font-semibold text-red-700">
              {status.overdue} ({overduePercent}%)
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-slate-600">Canceladas</span>
            <span className="font-semibold text-slate-600">
              {status.cancelled}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ReportsSection() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [dashboard, setDashboard] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultBusinessMeta = useMemo(() => getBusinessCountryMeta(), []);
  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/dashboard/finance?${params}`, {
        cache: "no-store",
      });

      const result: FinanceDashboardResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "No se pudieron cargar los reportes");
      }

      setDashboard(result.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los reportes financieros");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessSettings() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        const result: AppSettingsResponse = await response.json();

        if (!response.ok || !result.success) return;

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

  useEffect(() => {
    void loadReports();
  }, []);

  const reportCurrency = dashboard?.currency || businessCurrency;
  const previousPeriod = dashboard?.previousPeriod;

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Reportes / ingresos"
          title="Resumen financiero"
          description="Vista general de facturación, cobros, pendientes y rentabilidad del periodo."
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Actualizar datos"}
          </button>

          <div className="flex gap-2 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-8 rounded-md px-3 text-sm font-semibold text-slate-700 outline-none"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-8 rounded-md px-3 text-sm font-semibold text-slate-700 outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {!dashboard && loading && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando reportes financieros...
          </p>
        </div>
      )}

      {dashboard && (
        <>
          {dashboard.billing.totalOverdue > 0 && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <p className="font-semibold">Cobro prioritario</p>
              <p className="mt-1">
                Hay {dashboard.billing.overdueInvoiceCount} factura
                {dashboard.billing.overdueInvoiceCount === 1 ? "" : "s"} vencida
                {dashboard.billing.overdueInvoiceCount === 1 ? "" : "s"} por un
                total de{" "}
                {formatCurrency(
                  dashboard.billing.totalOverdue,
                  reportCurrency,
                  businessLocale,
                )}
                .
              </p>
            </div>
          )}

          <div className="mt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Estado de facturación
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                label="Total facturado"
                value={formatCurrency(
                  dashboard.billing.totalInvoiced,
                  reportCurrency,
                  businessLocale,
                )}
                helper={`${dashboard.billing.invoiceCount} facturas registradas`}
                change={getChange(
                  dashboard.billing.totalInvoiced,
                  previousPeriod?.totalInvoiced,
                )}
              />

              <DashboardCard
                label="Total pagado"
                value={formatCurrency(
                  dashboard.billing.totalPaid,
                  reportCurrency,
                  businessLocale,
                )}
                helper={`${dashboard.billing.paidInvoiceCount} facturas pagadas`}
                change={getChange(
                  dashboard.billing.totalPaid,
                  previousPeriod?.totalPaid,
                )}
              />

              <DashboardCard
                label="Saldo pendiente"
                value={formatCurrency(
                  dashboard.billing.totalPending,
                  reportCurrency,
                  businessLocale,
                )}
                helper={`${dashboard.billing.openInvoiceCount} facturas abiertas`}
                change={getChange(
                  dashboard.billing.totalPending,
                  previousPeriod?.totalPending,
                )}
              />

              <DashboardCard
                label="Vencido"
                value={formatCurrency(
                  dashboard.billing.totalOverdue,
                  reportCurrency,
                  businessLocale,
                )}
                helper="Saldo vencido"
                change={getChange(
                  dashboard.billing.totalOverdue,
                  previousPeriod?.totalOverdue,
                )}
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Pendientes y rentabilidad
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                label="Trabajos pendientes"
                value={String(dashboard.pendingBillables.count)}
                helper="Instalaciones y mantenimientos"
                change={null}
              />

              <DashboardCard
                label="Monto pendiente"
                value={formatCurrency(
                  dashboard.pendingBillables.totalAmount,
                  reportCurrency,
                  businessLocale,
                )}
                helper="Por facturar"
                change={getChange(
                  dashboard.pendingBillables.totalAmount,
                  previousPeriod?.pendingBillablesAmount,
                )}
              />

              <DashboardCard
                label="Costo estimado"
                value={formatCurrency(
                  dashboard.pendingBillables.totalCost,
                  reportCurrency,
                  businessLocale,
                )}
                helper="Costo interno"
                change={null}
              />

              <DashboardCard
                label="Utilidad estimada"
                value={formatCurrency(
                  dashboard.pendingBillables.estimatedProfit,
                  reportCurrency,
                  businessLocale,
                )}
                helper="Pendiente de facturar"
                change={getChange(
                  dashboard.pendingBillables.estimatedProfit,
                  previousPeriod?.estimatedProfit,
                )}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CompactMetricCard
              label="Cancelado"
              value={formatCurrency(
                dashboard.billing.totalCancelled,
                reportCurrency,
                businessLocale,
              )}
              helper="Facturas canceladas"
            />

            <CompactMetricCard
              label="Facturas abiertas"
              value={String(dashboard.billing.openInvoiceCount)}
              helper="Pendiente, parcial o vencida"
            />

            <CompactMetricCard
              label="Tasa de cobro"
              value={formatPercent(dashboard.indicators.collectionRate)}
              helper="Pagado sobre facturado"
            />

            <CompactMetricCard
              label="Potencial total"
              value={formatCurrency(
                dashboard.indicators.potentialTotal,
                reportCurrency,
                businessLocale,
              )}
              helper="Facturado + pendiente"
            />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <SimpleBarChart
              data={dashboard.trends}
              currency={reportCurrency}
              locale={businessLocale}
            />

            <SimpleLineChart
              data={dashboard.trends}
              currency={reportCurrency}
              locale={businessLocale}
            />
          </div>

          <div className="mt-5">
            <StatusDonut status={dashboard.invoiceStatus} />
          </div>

          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            Los datos se actualizan desde facturas, pagos y trabajos pendientes
            para facturar. Última actualización basada en el rango seleccionado.
          </div>
        </>
      )}
    </div>
  );
}
