"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
} from "@/lib/settings/countryPresets";

type Technician = {
  user_id?: string;
  full_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
    default_currency?: string | null;
  } | null;
};

type FollowUp = {
  follow_up_id: string;
  client_id: string;
  installation_id: string | null;
  target_date: string;
  scheduled_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  reason: string | null;
  priority: number | null;
  maintenance_type?: string | null;
  estimated_amount?: unknown;
  final_amount?: unknown;
  cost_amount?: unknown;
  billing_status?: string | null;
  billing_notes?: string | null;
  technician_id?: string | null;
  technician?: Technician | null;
  follow_up_status?: {
    code: string;
    name: string;
  };
  client?: {
    client_id?: string;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
  } | null;
  installation?: {
    installation_id?: string;
    description?: string | null;
    installation_date?: string | null;
  } | null;
};

type FollowUpFilter = "all" | "pending" | "completed" | "postponed";
type TimingFilter = "all" | "overdue" | "today" | "upcoming";
type PriorityFilter = "all" | "1" | "2" | "3";
type BillingFilter =
  | "all"
  | "PENDING"
  | "INVOICED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "NOT_BILLABLE"
  | "BILLING_ERROR"
  | "CANCELLED";
type SortMode = "target_date" | "priority" | "client" | "billing";

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

function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

function getStatusClasses(status?: string) {
  if (status === "completed") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "postponed") {
    return "border border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "confirmed") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border border-blue-200 bg-blue-50 text-blue-700";
}

function getPriorityClasses(priority?: number | null) {
  if (priority === 1) {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (priority === 2) {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === 3) {
    return "border border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-600";
}

function getBillingStatusLabel(status?: string | null) {
  switch (status) {
    case "PENDING":
      return "Pendiente de facturar";
    case "INVOICED":
      return "Facturado";
    case "PARTIALLY_PAID":
      return "Pago parcial";
    case "PAID":
      return "Pagado";
    case "NOT_BILLABLE":
      return "No facturable";
    case "BILLING_ERROR":
      return "Error de facturación";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Sin estado financiero";
  }
}

function getBillingStatusClasses(status?: string | null) {
  switch (status) {
    case "PAID":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INVOICED":
      return "border border-blue-200 bg-blue-50 text-blue-700";
    case "PARTIALLY_PAID":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "NOT_BILLABLE":
      return "border border-slate-200 bg-slate-50 text-slate-600";
    case "BILLING_ERROR":
      return "border border-red-200 bg-red-50 text-red-700";
    case "CANCELLED":
      return "border border-slate-300 bg-slate-100 text-slate-700";
    default:
      return "border border-violet-200 bg-violet-50 text-violet-700";
  }
}

function formatDateLabel(value?: string | null, locale = "es-CR") {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDateOnly(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function getTimingMeta(targetDate?: string | null, status?: string) {
  if (status === "completed") {
    return {
      key: "closed",
      label: "Cerrado",
      classes: "border border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  const target = getDateOnly(targetDate);

  if (!target) {
    return {
      key: "unknown",
      label: "Sin fecha",
      classes: "border border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (target.getTime() < today.getTime()) {
    return {
      key: "overdue",
      label: "Atrasado",
      classes: "border border-red-200 bg-red-50 text-red-700",
    };
  }

  if (target.getTime() === today.getTime()) {
    return {
      key: "today",
      label: "Hoy",
      classes: "border border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    key: "upcoming",
    label: "Próximo",
    classes: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getClientName(client?: FollowUp["client"]) {
  const composedName = [
    client?.first_name,
    client?.last_name_1,
    client?.last_name_2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || "Cliente sin nombre";
}

function getTechnicianName(technician?: Technician | null) {
  if (!technician) return "Sin técnico asignado";

  const composedName =
    technician.full_name ||
    technician.name ||
    [technician.first_name, technician.last_name].filter(Boolean).join(" ");

  return composedName?.trim() || technician.email || "Sin técnico asignado";
}

function formatMaintenanceType(value?: string | null) {
  if (!value) return "Mantenimiento general";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getMainAmount(item: FollowUp) {
  return toNumber(item.final_amount) ?? toNumber(item.estimated_amount);
}

function formatMoney(value: unknown, currency: string, locale: string) {
  const amount = toNumber(value);

  if (amount === null) return "No definido";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  }
}

function getSearchText(item: FollowUp) {
  return [
    getClientName(item.client),
    item.client?.phone_primary,
    item.reason,
    item.installation?.description,
    item.follow_up_status?.name,
    item.billing_status,
    getTechnicianName(item.technician),
    formatMaintenanceType(item.maintenance_type),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getDateTimeForSort(value?: string | null) {
  const parsed = new Date(value || "");

  if (Number.isNaN(parsed.getTime())) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsed.getTime();
}

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const defaultBusinessMeta = useMemo(() => getBusinessCountryMeta(), []);
  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );

  const [statusFilter, setStatusFilter] = useState<FollowUpFilter>("all");
  const [timingFilter, setTimingFilter] = useState<TimingFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("target_date");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadBusinessSettings() {
      try {
        const res = await fetch("/api/settings", {
          cache: "no-store",
        });

        const result: AppSettingsResponse = await res.json();

        if (!res.ok || !result.success) {
          return;
        }

        const businessMeta = getBusinessCountryMeta(result.data);

        setBusinessCurrency(businessMeta.currency);
        setBusinessLocale(businessMeta.locale);
      } catch {
        // Keep default business metadata if settings cannot be loaded.
      }
    }

    async function loadFollowUps() {
      try {
        await loadBusinessSettings();

        const res = await fetch("/api/follow-ups", {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error("Failed to load follow ups");
        }

        setItems(result.data || []);
      } catch {
        setError("No se pudieron cargar los mantenimientos");
      } finally {
        setLoading(false);
      }
    }

    void loadFollowUps();
  }, []);

  const counters = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.follow_up_status?.code === "pending")
        .length,
      completed: items.filter(
        (item) => item.follow_up_status?.code === "completed",
      ).length,
      overdue: items.filter(
        (item) =>
          getTimingMeta(item.target_date, item.follow_up_status?.code).key ===
          "overdue",
      ).length,
      today: items.filter(
        (item) =>
          getTimingMeta(item.target_date, item.follow_up_status?.code).key ===
          "today",
      ).length,
      highPriority: items.filter(
        (item) =>
          item.follow_up_status?.code !== "completed" && item.priority === 1,
      ).length,
      pendingBilling: items.filter(
        (item) =>
          item.follow_up_status?.code !== "completed" &&
          (!item.billing_status || item.billing_status === "PENDING"),
      ).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = items.filter((item) => {
      const statusCode = item.follow_up_status?.code;
      const timingKey = getTimingMeta(
        item.target_date,
        item.follow_up_status?.code,
      ).key;

      if (statusFilter !== "all" && statusCode !== statusFilter) {
        return false;
      }

      if (timingFilter !== "all" && timingKey !== timingFilter) {
        return false;
      }

      if (
        priorityFilter !== "all" &&
        item.priority !== Number(priorityFilter)
      ) {
        return false;
      }

      if (billingFilter !== "all" && item.billing_status !== billingFilter) {
        return false;
      }

      if (normalizedSearch && !getSearchText(item).includes(normalizedSearch)) {
        return false;
      }

      return true;
    });

    return [...result].sort((a, b) => {
      if (sortMode === "priority") {
        return (a.priority ?? 99) - (b.priority ?? 99);
      }

      if (sortMode === "client") {
        return getClientName(a.client).localeCompare(getClientName(b.client));
      }

      if (sortMode === "billing") {
        return (getMainAmount(b) ?? 0) - (getMainAmount(a) ?? 0);
      }

      return (
        getDateTimeForSort(a.scheduled_date || a.target_date) -
        getDateTimeForSort(b.scheduled_date || b.target_date)
      );
    });
  }, [
    billingFilter,
    items,
    priorityFilter,
    searchTerm,
    sortMode,
    statusFilter,
    timingFilter,
  ]);

  function clearFilters() {
    setStatusFilter("all");
    setTimingFilter("all");
    setPriorityFilter("all");
    setBillingFilter("all");
    setSortMode("target_date");
    setSearchTerm("");
  }

  if (loading) {
    return (
      <main className="p-6 md:p-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Cargando mantenimientos...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 md:p-8">
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Centro operativo
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Mantenimientos
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Cliente, instalación, técnico, agenda y facturación conectados
                en una sola vista.
              </p>
            </div>
          </div>

          <Link
            href="/follow-ups/new"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo mantenimiento
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Total
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {counters.total}
            </p>
            <p className="mt-1 text-sm text-slate-500">Registrados</p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Pendientes
            </p>
            <p className="mt-3 text-3xl font-bold text-blue-800">
              {counters.pending}
            </p>
            <p className="mt-1 text-sm text-blue-700">En seguimiento</p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
              Atrasados
            </p>
            <p className="mt-3 text-3xl font-bold text-red-800">
              {counters.overdue}
            </p>
            <p className="mt-1 text-sm text-red-700">Atención urgente</p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
              Hoy
            </p>
            <p className="mt-3 text-3xl font-bold text-amber-800">
              {counters.today}
            </p>
            <p className="mt-1 text-sm text-amber-700">Para revisar</p>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              Facturación
            </p>
            <p className="mt-3 text-3xl font-bold text-violet-800">
              {counters.pendingBilling}
            </p>
            <p className="mt-1 text-sm text-violet-700">Pendientes</p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
              Cerrados
            </p>
            <p className="mt-3 text-3xl font-bold text-emerald-800">
              {counters.completed}
            </p>
            <p className="mt-1 text-sm text-emerald-700">Completados</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Buscar
                </label>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, teléfono, instalación, técnico o motivo..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Prioridad
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as PriorityFilter)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  <option value="all">Todas</option>
                  <option value="1">Alta</option>
                  <option value="2">Media</option>
                  <option value="3">Baja</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Facturación
                </label>
                <select
                  value={billingFilter}
                  onChange={(e) =>
                    setBillingFilter(e.target.value as BillingFilter)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  <option value="all">Todos</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="INVOICED">Facturado</option>
                  <option value="PARTIALLY_PAID">Pago parcial</option>
                  <option value="PAID">Pagado</option>
                  <option value="NOT_BILLABLE">No facturable</option>
                  <option value="BILLING_ERROR">Error</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ordenar por
                </label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  <option value="target_date">Fecha agenda / objetivo</option>
                  <option value="priority">Prioridad</option>
                  <option value="client">Cliente</option>
                  <option value="billing">Monto</option>
                </select>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Estado
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={getFilterButtonClass(statusFilter === "all")}
                >
                  Todos
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={getFilterButtonClass(statusFilter === "pending")}
                >
                  Pendientes
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("completed")}
                  className={getFilterButtonClass(statusFilter === "completed")}
                >
                  Completados
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("postponed")}
                  className={getFilterButtonClass(statusFilter === "postponed")}
                >
                  Pospuestos
                </button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Urgencia
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTimingFilter("all")}
                  className={getFilterButtonClass(timingFilter === "all")}
                >
                  Todas
                </button>

                <button
                  type="button"
                  onClick={() => setTimingFilter("overdue")}
                  className={getFilterButtonClass(timingFilter === "overdue")}
                >
                  Atrasados
                </button>

                <button
                  type="button"
                  onClick={() => setTimingFilter("today")}
                  className={getFilterButtonClass(timingFilter === "today")}
                >
                  Hoy
                </button>

                <button
                  type="button"
                  onClick={() => setTimingFilter("upcoming")}
                  className={getFilterButtonClass(timingFilter === "upcoming")}
                >
                  Próximos
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mostrando{" "}
                <span className="font-semibold">{filteredItems.length}</span> de{" "}
                <span className="font-semibold">{items.length}</span>{" "}
                mantenimiento{items.length === 1 ? "" : "s"}
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </section>

        {filteredItems.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800">
              No se encontraron mantenimientos
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Prueba con otro filtro o registra un nuevo mantenimiento.
            </p>

            <Link
              href="/follow-ups/new"
              className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Crear mantenimiento
            </Link>
          </section>
        ) : (
          <ul className="space-y-4">
            {filteredItems.map((item) => {
              const formattedTargetDate = formatDateLabel(
                item.target_date,
                businessLocale,
              );
              const formattedScheduledDate = formatDateLabel(
                item.scheduled_date,
                businessLocale,
              );
              const formattedDueDate = formatDateLabel(
                item.due_date,
                businessLocale,
              );
              const formattedInstallationDate = formatDateLabel(
                item.installation?.installation_date,
                businessLocale,
              );
              const timingMeta = getTimingMeta(
                item.target_date,
                item.follow_up_status?.code,
              );
              const clientName = getClientName(item.client);
              const technicianName = getTechnicianName(item.technician);
              const amount = getMainAmount(item);

              return (
                <li
                  key={item.follow_up_id}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:p-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/follow-ups/${item.follow_up_id}`}
                            className="block"
                          >
                            <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900 transition group-hover:text-slate-700">
                              {clientName}
                            </h2>
                          </Link>

                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {formatMaintenanceType(item.maintenance_type)}
                          </p>

                          <p className="mt-2 text-sm text-slate-600">
                            {item.reason || "Mantenimiento programado"}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                item.follow_up_status?.code,
                              )}`}
                            >
                              {item.follow_up_status?.name || "Sin estado"}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                                item.priority,
                              )}`}
                            >
                              Prioridad {item.priority ?? "-"}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${timingMeta.classes}`}
                            >
                              {timingMeta.label}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBillingStatusClasses(
                                item.billing_status,
                              )}`}
                            >
                              {getBillingStatusLabel(item.billing_status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Fecha objetivo
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {formattedTargetDate || "No disponible"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Fecha agendada
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {formattedScheduledDate || "Sin agendar"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Técnico
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {technicianName}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Monto
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {amount === null
                              ? "No definido"
                              : formatMoney(
                                  amount,
                                  businessCurrency,
                                  businessLocale,
                                )}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-2">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Instalación
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {item.installation?.description ||
                              "Sin instalación asociada"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Fecha de instalación:{" "}
                            {formattedInstallationDate || "No disponible"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Fecha límite
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {formattedDueDate || "No definida"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Teléfono
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {item.client?.phone_primary || "No disponible"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row flex-wrap gap-2 xl:w-auto xl:flex-col xl:items-end">
                      <Link
                        href={`/follow-ups/${item.follow_up_id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver detalle
                      </Link>

                      <Link
                        href={`/contact-attempts/new?follow_up_id=${item.follow_up_id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Registrar intento
                      </Link>

                      <Link
                        href={`/clients/${item.client_id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cliente
                      </Link>

                      {item.installation_id && (
                        <Link
                          href={`/installations/${item.installation_id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Instalación
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
