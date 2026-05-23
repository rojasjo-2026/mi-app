"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
} from "@/lib/settings/countryPresets";

type PaymentTerm = "CASH" | "CREDIT";
type SourceType = "INSTALLATION" | "FOLLOW_UP" | "MANUAL";

type FinanceInvoiceDraftFormProps = {
  client?: {
    client_id?: string;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
    email?: string | null;
    billing_name?: string | null;
    billing_email?: string | null;
    billing_phone?: string | null;
    billing_address?: string | null;
    tax_id?: string | null;
    default_payment_term?: PaymentTerm | null;
    default_credit_days?: number | null;
    default_discount_rate?: number | string | null;
    tax_exempt?: boolean | null;
    country_code?: string | null;
    identification_country?: string | null;
    preferred_currency?: string | null;
  } | null;

  installationId?: string | null;
  followUpId?: string | null;
  sourceType?: SourceType;
  serviceDescription?: string | null;
  estimatedAmount?: number | string | null;
  finalAmount?: number | string | null;
  onInvoiceCreated?: (invoice: unknown) => void;
};

function buildClientName(client?: FinanceInvoiceDraftFormProps["client"]) {
  if (!client) return "";

  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
    default_currency?: string | null;
    default_tax_rate?: number | string | null;
  } | null;
};

const DEFAULT_COUNTRY_CODE = "CR";

const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? Object.values(COUNTRY_PRESETS)[0];

function getBusinessCountryMeta(
  settings?: AppSettingsResponse["data"],
  client?: FinanceInvoiceDraftFormProps["client"],
) {
  const countryPreset =
    getCountryPreset(
      client?.country_code ??
        client?.identification_country ??
        settings?.country_code,
    ) ?? fallbackCountryPreset;

  return {
    currency:
      client?.preferred_currency ||
      settings?.default_currency ||
      countryPreset.primaryCurrency,
    locale: countryPreset.locale,
    taxLabel: countryPreset.taxLabel || "IVA",
    taxRate:
      settings?.default_tax_rate !== null &&
      settings?.default_tax_rate !== undefined
        ? Number(settings.default_tax_rate)
        : countryPreset.defaultTaxRate,
  };
}

function formatMoney(value: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(locale, {
      minimumFractionDigits: 0,
    })}`;
  }
}

export default function FinanceInvoiceDraftForm({
  client,
  installationId = null,
  followUpId = null,
  sourceType = "MANUAL",
  serviceDescription,
  estimatedAmount,
  finalAmount,
  onInvoiceCreated,
}: FinanceInvoiceDraftFormProps) {
  const defaultClientName = client?.billing_name || buildClientName(client);
  const defaultPhone = client?.billing_phone || client?.phone_primary || "";
  const defaultEmail = client?.billing_email || client?.email || "";
  const defaultAddress = client?.billing_address || "";
  const defaultBusinessMeta = useMemo(
    () => getBusinessCountryMeta(undefined, client),
    [client],
  );

  const baseAmount = Number(finalAmount ?? estimatedAmount ?? 0);

  const [customerName, setCustomerName] = useState(defaultClientName);
  const [customerPhone, setCustomerPhone] = useState(defaultPhone);
  const [customerEmail, setCustomerEmail] = useState(defaultEmail);
  const [taxId, setTaxId] = useState(client?.tax_id ?? "");
  const [billingAddress, setBillingAddress] = useState(defaultAddress);

  const [description, setDescription] = useState(
    serviceDescription ?? "Servicio realizado",
  );

  const [amount, setAmount] = useState(baseAmount);
  const [discountRate, setDiscountRate] = useState(
    Number(client?.default_discount_rate ?? 0),
  );

  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );
  const [businessTaxLabel, setBusinessTaxLabel] = useState(
    defaultBusinessMeta.taxLabel,
  );
  const [businessTaxRate, setBusinessTaxRate] = useState(
    defaultBusinessMeta.taxRate,
  );

  const [applyTax, setApplyTax] = useState(!client?.tax_exempt);
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>(
    client?.default_payment_term ?? "CASH",
  );
  const [creditDays, setCreditDays] = useState(
    client?.default_credit_days ?? 0,
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

        const businessMeta = getBusinessCountryMeta(result.data, client);

        if (!isMounted) return;

        setBusinessCurrency(businessMeta.currency);
        setBusinessLocale(businessMeta.locale);
        setBusinessTaxLabel(businessMeta.taxLabel);
        setBusinessTaxRate(businessMeta.taxRate);
      } catch {
        // Keep default business metadata if settings cannot be loaded.
      }
    }

    void loadBusinessSettings();

    return () => {
      isMounted = false;
    };
  }, [client]);

  const totals = useMemo(() => {
    const subtotal = Number(amount || 0);
    const discount = subtotal * (Number(discountRate || 0) / 100);
    const taxable = subtotal - discount;
    const tax = applyTax ? taxable * (Number(businessTaxRate || 0) / 100) : 0;
    const total = taxable + tax;

    return {
      subtotal,
      discount,
      tax,
      total,
    };
  }, [amount, discountRate, applyTax, businessTaxRate]);

  async function handleGenerateInvoice() {
    setError("");
    setMessage("");

    if (!client?.client_id) {
      setError(
        "No se puede generar la factura porque no hay un cliente real asociado.",
      );
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("El monto base debe ser mayor a cero.");
      return;
    }

    if (sourceType === "INSTALLATION" && !installationId) {
      setError(
        "No se encontró la instalación asociada para generar la factura.",
      );
      return;
    }

    if (sourceType === "FOLLOW_UP" && !followUpId) {
      setError(
        "No se encontró el mantenimiento asociado para generar la factura.",
      );
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: client.client_id,
          installation_id:
            sourceType === "INSTALLATION" ? installationId : null,
          follow_up_id: sourceType === "FOLLOW_UP" ? followUpId : null,
          source_type: sourceType,

          payment_term: paymentTerm,
          credit_days: paymentTerm === "CREDIT" ? creditDays : null,
          currency: businessCurrency,

          description,
          quantity: 1,
          unit_price: amount,

          discount_rate: discountRate,
          discount_reason: null,
          tax_rate: applyTax ? businessTaxRate : 0,
          tax_exempt: !applyTax,

          customer_snapshot_name: customerName,
          customer_snapshot_phone: customerPhone,
          service_snapshot_description: description,
          location_snapshot: billingAddress,
          notes: taxId ? `Cédula / ID fiscal: ${taxId}` : null,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudo generar la factura");
      }

      setMessage("Factura generada correctamente.");
      onInvoiceCreated?.(result.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo generar la factura");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Finanzas
        </p>
        <h2 className="text-xl font-semibold text-gray-900">Nueva factura</h2>
        <p className="mt-1 text-sm text-gray-500">
          Complete o ajuste los datos antes de generar la factura.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border bg-gray-50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Datos del cliente
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-600">
                Nombre de facturación
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Nombre del cliente o razón social"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Teléfono</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Número de teléfono"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Cédula / ID fiscal
              </label>
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Opcional"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">
                Dirección de facturación
              </label>
              <textarea
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="mt-1 min-h-20 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Dirección fiscal o dirección del servicio"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-gray-50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Datos del servicio
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-600">Origen</label>
              <input
                value={
                  sourceType === "FOLLOW_UP"
                    ? "Mantenimiento"
                    : sourceType === "INSTALLATION"
                      ? "Instalación"
                      : "Manual"
                }
                readOnly
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Monto base</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-20 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Descuento (%)</label>
              <input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={applyTax}
                onChange={(e) => setApplyTax(e.target.checked)}
                className="h-4 w-4"
              />
              Aplicar {businessTaxLabel} {Number(businessTaxRate || 0)}%
            </label>
          </div>
        </div>

        <div className="rounded-2xl border bg-gray-50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Condiciones de pago
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-600">Tipo de pago</label>
              <select
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value as PaymentTerm)}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="CASH">Contado</option>
                <option value="CREDIT">Crédito</option>
              </select>
            </div>

            {paymentTerm === "CREDIT" && (
              <div>
                <label className="text-sm text-gray-600">Días crédito</label>
                <input
                  type="number"
                  value={creditDays}
                  onChange={(e) => setCreditDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Resumen</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">
                {formatMoney(totals.subtotal, businessCurrency, businessLocale)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Descuento</span>
              <span className="font-medium">
                {formatMoney(totals.discount, businessCurrency, businessLocale)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">{businessTaxLabel}</span>
              <span className="font-medium">
                {formatMoney(totals.tax, businessCurrency, businessLocale)}
              </span>
            </div>

            <div className="mt-3 flex justify-between border-t pt-3 text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">
                {formatMoney(totals.total, businessCurrency, businessLocale)}
              </span>
            </div>
          </div>

          {message && (
            <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Generando factura..." : "Generar factura"}
          </button>
        </div>
      </div>
    </section>
  );
}
