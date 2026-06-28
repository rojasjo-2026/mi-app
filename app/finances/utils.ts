import type { FinanceInvoice } from "./types";
import {
  DEFAULT_CURRENCY_CODE,
  fallbackCountryPreset,
} from "@/lib/settings/appSettingsUtils";

const DEFAULT_LOCALE = fallbackCountryPreset.locale;
const DEFAULT_CURRENCY = DEFAULT_CURRENCY_CODE;

const currencyLocaleMap: Record<string, string> = {
  ARS: "es-AR",
  BOB: "es-BO",
  BRL: "pt-BR",
  CAD: "en-CA",
  CLP: "es-CL",
  COP: "es-CO",
  CRC: "es-CR",
  DOP: "es-DO",
  EUR: "es-ES",
  GTQ: "es-GT",
  HNL: "es-HN",
  MXN: "es-MX",
  NIO: "es-NI",
  PEN: "es-PE",
  PYG: "es-PY",
  USD: "en-US",
  UYU: "es-UY",
  VES: "es-VE",
  XAF: "es-GQ",
};

export function toSafeNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCurrencyCode(currency?: string | null) {
  const normalizedCurrency = String(currency || DEFAULT_CURRENCY)
    .trim()
    .toUpperCase();

  return normalizedCurrency || DEFAULT_CURRENCY;
}

function getLocaleForCurrency(currency?: string | null) {
  const normalizedCurrency = normalizeCurrencyCode(currency);

  return currencyLocaleMap[normalizedCurrency] ?? DEFAULT_LOCALE;
}

export function getInvoiceCurrency(invoice?: Pick<FinanceInvoice, "currency">) {
  return normalizeCurrencyCode(invoice?.currency);
}

export function formatCurrency(
  value?: number | string | null,
  currency?: string | null,
  locale?: string,
) {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const resolvedLocale = locale || getLocaleForCurrency(normalizedCurrency);
  const amount = toSafeNumber(value);

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${normalizedCurrency} ${amount.toLocaleString(resolvedLocale, {
      maximumFractionDigits: 0,
    })}`;
  }
}

export function formatDateLabel(
  value?: string | null,
  locale = DEFAULT_LOCALE,
) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getClientName(client?: FinanceInvoice["client"]) {
  if (!client) return "-";

  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export function getInvoiceStatusLabel(status?: string | null) {
  if (status === "PENDING") return "Pendiente";
  if (status === "PARTIALLY_PAID") return "Parcialmente pagado";
  if (status === "PAID") return "Pagado";
  if (status === "OVERDUE") return "Vencido";
  if (status === "CANCELLED") return "Cancelado";

  return status || "Sin estado";
}

export function getInvoiceStatusClass(status?: string | null) {
  if (status === "PAID") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PARTIALLY_PAID") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "OVERDUE") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (status === "CANCELLED") {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

export function getBillingStatusLabel(status?: string | null) {
  if (status === "PENDING") return "Pendiente";
  if (status === "INVOICED") return "Facturado";
  if (status === "PARTIALLY_PAID") return "Parcialmente pagado";
  if (status === "PAID") return "Pagado";
  if (status === "NOT_BILLABLE") return "No facturable";
  if (status === "BILLING_ERROR") return "Error de facturación";
  if (status === "CANCELLED") return "Cancelado";

  return status || "Sin estado";
}

export function getBillingStatusClass(status?: string | null) {
  if (status === "PAID") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "INVOICED" || status === "PARTIALLY_PAID") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "BILLING_ERROR" || status === "CANCELLED") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (status === "NOT_BILLABLE") {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

export function getInvoiceOrigin(invoice: FinanceInvoice) {
  if (invoice.installation) {
    return invoice.installation.description || "Instalación";
  }

  if (invoice.follow_up) {
    return invoice.follow_up.reason || "Mantenimiento";
  }

  return "Factura manual";
}

export function formatPaymentTerm(term?: string | null) {
  if (term === "CASH") return "Contado";
  if (term === "CREDIT") return "Crédito";

  return term || "-";
}

export function formatPaymentMethod(method?: string | null) {
  if (method === "CASH") return "Efectivo";
  if (method === "SINPE") return "SINPE";
  if (method === "BANK_TRANSFER") return "Transferencia bancaria";
  if (method === "TRANSFER") return "Transferencia";
  if (method === "CHECK") return "Cheque";
  if (method === "CARD") return "Tarjeta";
  if (method === "OTHER") return "Otro";

  return method || "-";
}
