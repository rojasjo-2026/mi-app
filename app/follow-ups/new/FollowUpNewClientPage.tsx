"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  resolveAppSettings,
  type AppSettingsResponse,
} from "@/lib/config/app-settings";
import OperationalZoneSelect from "@/app/settings/components/OperationalZoneSelect";

type InstallationOption = {
  installation_id: string;
  description?: string | null;
  installation_date?: string | null;
  operational_zone_id?: string | null;
  client_id?: string | null;
  client?: {
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
  } | null;
};

type TechnicianOption = {
  user_id: string;
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  email?: string | null;
  is_active?: boolean;
};

const billingStatusOptions = [
  { value: "PENDING", label: "Pendiente por facturar" },
  { value: "INVOICED", label: "Facturado" },
  { value: "PARTIALLY_PAID", label: "Parcialmente pagado" },
  { value: "PAID", label: "Pagado" },
  { value: "NOT_BILLABLE", label: "No facturable" },
  { value: "BILLING_ERROR", label: "Error de facturación" },
  { value: "CANCELLED", label: "Cancelado" },
];

const maintenanceTypeOptions = [
  { value: "", label: "Sin tipo definido" },
  { value: "PREVENTIVE", label: "Preventivo" },
  { value: "CORRECTIVE", label: "Correctivo" },
  { value: "WARRANTY", label: "Garantía" },
  { value: "INSPECTION", label: "Inspección" },
  { value: "OTHER", label: "Otro" },
];

function getBusinessCountryMeta(settings?: AppSettingsResponse["data"]) {
  const resolvedSettings = resolveAppSettings(settings);

  return {
    countryCode: resolvedSettings.countryCode,
    currency: resolvedSettings.currency,
    locale: resolvedSettings.locale,
  };
}

function getClientName(client?: InstallationOption["client"]) {
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

function getTechnicianName(technician?: TechnicianOption | null) {
  const composedName = [
    technician?.first_name,
    technician?.last_name_1,
    technician?.last_name_2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || technician?.email || "Técnico sin nombre";
}

function formatDateLabel(value?: string | null, locale?: string | null) {
  if (!value) return "Sin fecha";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(locale || resolveAppSettings().locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoneyPreview(value: string, currency: string, locale: string) {
  if (!value) return "-";

  const parsed = Number(value);

  if (Number.isNaN(parsed)) return "-";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(parsed);
  } catch {
    return `${currency} ${parsed.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  }
}

function getOptionLabel(
  options: Array<{ value: string; label: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label || "-";
}

export default function FollowUpNewClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const installationIdFromQuery =
    searchParams.get("installationId") ||
    searchParams.get("installation_id") ||
    "";

  const [installations, setInstallations] = useState<InstallationOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);

  const [loadingInstallations, setLoadingInstallations] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState("");

  const defaultBusinessMeta = useMemo(() => getBusinessCountryMeta(), []);
  const [businessCountryCode, setBusinessCountryCode] = useState(
    defaultBusinessMeta.countryCode,
  );
  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );

  const [installationId, setInstallationId] = useState(installationIdFromQuery);
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("2");
  const [reason, setReason] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [operationalZoneId, setOperationalZoneId] = useState("");

  const [maintenanceType, setMaintenanceType] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [billingStatus, setBillingStatus] = useState("PENDING");
  const [billingNotes, setBillingNotes] = useState("");

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

        setBusinessCountryCode(businessMeta.countryCode);
        setBusinessCurrency(businessMeta.currency);
        setBusinessLocale(businessMeta.locale);
      } catch {
        // Keep default business metadata if settings cannot be loaded.
      }
    }

    async function loadPageData() {
      try {
        await loadBusinessSettings();

        const [installationsRes, techniciansRes] = await Promise.all([
          fetch("/api/installations", {
            cache: "no-store",
          }),
          fetch("/api/users?role=TECHNICIAN&is_active=true", {
            cache: "no-store",
          }),
        ]);

        const installationsResult = await installationsRes.json();
        const techniciansResult = await techniciansRes.json();

        if (!installationsRes.ok || !installationsResult.success) {
          throw new Error("No se pudieron cargar las instalaciones");
        }

        if (!techniciansRes.ok || !techniciansResult.success) {
          throw new Error("No se pudieron cargar los técnicos");
        }

        setInstallations(
          Array.isArray(installationsResult.data)
            ? installationsResult.data
            : [],
        );

        setTechnicians(
          Array.isArray(techniciansResult.data) ? techniciansResult.data : [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la información inicial",
        );
      } finally {
        setLoadingInstallations(false);
        setLoadingTechnicians(false);
      }
    }

    void loadPageData();
  }, []);

  const selectedInstallation = useMemo(() => {
    return (
      installations.find((item) => item.installation_id === installationId) ||
      null
    );
  }, [installations, installationId]);

  useEffect(() => {
    setOperationalZoneId(selectedInstallation?.operational_zone_id || "");
  }, [selectedInstallation?.operational_zone_id]);

  const selectedTechnician = useMemo(() => {
    return technicians.find((item) => item.user_id === technicianId) || null;
  }, [technicians, technicianId]);

  const clientId = selectedInstallation?.client_id || "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!installationId) {
      setError("Debes seleccionar una instalación");
      return;
    }

    if (!clientId) {
      setError("La instalación seleccionada no tiene un cliente asociado");
      return;
    }

    if (!targetDate) {
      setError("Debes seleccionar una fecha objetivo");
      return;
    }

    setLoadingSubmit(true);

    try {
      const payload = {
        installation_id: installationId,
        client_id: clientId,
        target_date: targetDate,
        priority: Number(priority),
        reason: reason.trim() || null,
        technician_id: technicianId || null,
        operational_zone_id: operationalZoneId || null,
        maintenance_type: maintenanceType || null,
        estimated_amount: estimatedAmount ? Number(estimatedAmount) : null,
        cost_amount: costAmount ? Number(costAmount) : null,
        billing_status: billingStatus || "PENDING",
        billing_notes: billingNotes.trim() || null,
      };

      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudo crear el mantenimiento");
      }

      router.push("/follow-ups");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el mantenimiento",
      );
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Gestión de mantenimientos
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Nuevo mantenimiento
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Crea un mantenimiento a partir de una instalación existente.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/follow-ups"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Información general
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Define la instalación, fecha, prioridad, técnico y motivo
                    del mantenimiento.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Instalación
                  </label>

                  <select
                    value={installationId}
                    onChange={(e) => setInstallationId(e.target.value)}
                    disabled={loadingInstallations}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                  >
                    <option value="">
                      {loadingInstallations
                        ? "Cargando instalaciones..."
                        : "Selecciona una instalación"}
                    </option>

                    {installations.map((item) => (
                      <option
                        key={item.installation_id}
                        value={item.installation_id}
                      >
                        {getClientName(item.client)} —{" "}
                        {item.description || "Instalación sin descripción"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Fecha objetivo
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Prioridad
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    >
                      <option value="1">1 - Alta</option>
                      <option value="2">2 - Media</option>
                      <option value="3">3 - Baja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Técnico asignado
                  </label>
                  <select
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    disabled={loadingTechnicians}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                  >
                    <option value="">
                      {loadingTechnicians
                        ? "Cargando técnicos..."
                        : "Sin técnico asignado"}
                    </option>

                    {technicians.map((item) => (
                      <option key={item.user_id} value={item.user_id}>
                        {getTechnicianName(item)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    Este campo es opcional y puede ajustarse después.
                  </p>
                </div>

                <div>
                  <OperationalZoneSelect
                    value={operationalZoneId}
                    countryCode={businessCountryCode}
                    label="Zona operativa"
                    helperText="Por defecto se toma de la instalación seleccionada. Puede ajustarse si este mantenimiento debe procesarse en otra zona."
                    onChange={setOperationalZoneId}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Motivo o detalle
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={5}
                    placeholder="Ejemplo: revisión preventiva, limpieza, ajuste o control de garantía"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                  />
                </div>
              </section>

              <section className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Información comercial
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Campos opcionales para preparar el mantenimiento para
                    facturación.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tipo de mantenimiento
                    </label>
                    <select
                      value={maintenanceType}
                      onChange={(e) => setMaintenanceType(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    >
                      {maintenanceTypeOptions.map((option) => (
                        <option
                          key={option.value || "empty"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Estado de facturación
                    </label>
                    <select
                      value={billingStatus}
                      onChange={(e) => setBillingStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    >
                      {billingStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Monto estimado
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={estimatedAmount}
                      onChange={(e) => setEstimatedAmount(e.target.value)}
                      placeholder="Ej: 50000"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Costo interno
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={costAmount}
                      onChange={(e) => setCostAmount(e.target.value)}
                      placeholder="Ej: 30000"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Notas de facturación
                  </label>
                  <textarea
                    value={billingNotes}
                    onChange={(e) => setBillingNotes(e.target.value)}
                    rows={3}
                    placeholder="Notas internas para facturación, cobro o condiciones comerciales."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                  />
                </div>
              </section>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    loadingSubmit || loadingInstallations || loadingTechnicians
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingSubmit ? "Guardando..." : "Crear mantenimiento"}
                </button>

                <Link
                  href="/follow-ups"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Resumen
              </p>

              {selectedInstallation ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {getClientName(selectedInstallation.client)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedInstallation.description ||
                        "Instalación sin descripción"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Fecha de instalación
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDateLabel(
                        selectedInstallation.installation_date,
                        businessLocale,
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Zona operativa
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {operationalZoneId
                        ? "Zona asignada"
                        : "Sin zona operativa"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Técnico asignado
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedTechnician
                        ? getTechnicianName(selectedTechnician)
                        : "Sin técnico asignado"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Tipo de mantenimiento
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {getOptionLabel(maintenanceTypeOptions, maintenanceType)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Estado de facturación
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {getOptionLabel(billingStatusOptions, billingStatus)}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Monto estimado
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {formatMoneyPreview(
                          estimatedAmount,
                          businessCurrency,
                          businessLocale,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Costo interno
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {formatMoneyPreview(
                          costAmount,
                          businessCurrency,
                          businessLocale,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Selecciona una instalación para ver el resumen del
                  mantenimiento.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Nota
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Este formulario crea el mantenimiento directamente en el listado
                general. Los datos comerciales y el técnico asignado son
                opcionales y pueden ajustarse después desde el detalle del
                mantenimiento.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
