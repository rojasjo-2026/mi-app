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

type SummaryRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

type OperationalZoneVisitDateSuggestion = {
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
  visit_date: string;
  can_offer_day: true;
  reason: string;
};

type OperationalZoneVisitDateSuggestionsApiResponse = {
  success: boolean;
  data?: OperationalZoneVisitDateSuggestion[];
  message?: string;
};

const controlClassName =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const textareaClassName =
  "w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-5 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

const labelClassName = "mb-1.5 block text-sm font-medium text-slate-700";

function SummaryRow({ label, value, last = false }: SummaryRowProps) {
  return (
    <div
      className={`grid gap-1 px-3 py-2.5 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-start ${
        last ? "" : "border-b border-slate-200"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="break-words text-sm font-medium leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}

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

function formatSuggestedVisitDate(value: string, locale: string) {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
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
  const [visitDateSuggestions, setVisitDateSuggestions] = useState<
    OperationalZoneVisitDateSuggestion[]
  >([]);
  const [loadingVisitDateSuggestions, setLoadingVisitDateSuggestions] =
    useState(false);
  const [visitDateSuggestionsMessage, setVisitDateSuggestionsMessage] =
    useState("");
  const [visitDateSuggestionsError, setVisitDateSuggestionsError] =
    useState("");

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

  useEffect(() => {
    if (!operationalZoneId) {
      setVisitDateSuggestions([]);
      setVisitDateSuggestionsMessage("");
      setVisitDateSuggestionsError("");
      setLoadingVisitDateSuggestions(false);
      return;
    }

    const controller = new AbortController();

    async function loadVisitDateSuggestions() {
      try {
        setLoadingVisitDateSuggestions(true);
        setVisitDateSuggestions([]);
        setVisitDateSuggestionsMessage("");
        setVisitDateSuggestionsError("");

        const response = await fetch(
          `/api/operational-zones/${encodeURIComponent(
            operationalZoneId,
          )}/visit-date-suggestions`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: OperationalZoneVisitDateSuggestionsApiResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "No se pudieron cargar las fechas sugeridas.",
          );
        }

        setVisitDateSuggestions(Array.isArray(result.data) ? result.data : []);
        setVisitDateSuggestionsMessage(result.message || "");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setVisitDateSuggestions([]);
        setVisitDateSuggestionsMessage("");
        setVisitDateSuggestionsError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar las fechas sugeridas.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingVisitDateSuggestions(false);
        }
      }
    }

    void loadVisitDateSuggestions();

    return () => {
      controller.abort();
    };
  }, [operationalZoneId]);

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
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Gestión de mantenimientos
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Nuevo mantenimiento
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Crea un mantenimiento a partir de una instalación existente.
            </p>
          </div>

          <Link
            href="/follow-ups"
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Volver
          </Link>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Información general
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Define la instalación, fecha, prioridad, técnico y motivo
                    del mantenimiento.
                  </p>
                </div>

                <div>
                  <label className={labelClassName}>Instalación</label>

                  <select
                    value={installationId}
                    onChange={(e) => setInstallationId(e.target.value)}
                    disabled={loadingInstallations}
                    className={controlClassName}
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClassName}>Fecha objetivo</label>

                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className={controlClassName}
                    />

                    {loadingVisitDateSuggestions ? (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Consultando fechas sugeridas para la zona...
                      </p>
                    ) : visitDateSuggestions.length > 0 ? (
                      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                          Fechas sugeridas para la zona seleccionada
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {visitDateSuggestions.map((suggestion) => {
                            const isSelected =
                              targetDate === suggestion.visit_date;

                            return (
                              <button
                                key={suggestion.operational_zone_visit_date_id}
                                type="button"
                                title={suggestion.reason}
                                onClick={() =>
                                  setTargetDate(suggestion.visit_date)
                                }
                                className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                                  isSelected
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {formatSuggestedVisitDate(
                                  suggestion.visit_date,
                                  businessLocale,
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Son sugerencias según la planificación de la zona y la
                          disponibilidad actual. Puede seleccionar otra fecha
                          manualmente.
                        </p>
                      </div>
                    ) : operationalZoneId && visitDateSuggestionsMessage ? (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {visitDateSuggestionsMessage}
                      </p>
                    ) : null}

                    {visitDateSuggestionsError ? (
                      <p className="mt-2 text-xs leading-5 text-amber-700">
                        {visitDateSuggestionsError} Puede continuar
                        seleccionando la fecha manualmente.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClassName}>Prioridad</label>

                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className={controlClassName}
                    >
                      <option value="1">1 - Alta</option>
                      <option value="2">2 - Media</option>
                      <option value="3">3 - Baja</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClassName}>Técnico asignado</label>

                    <select
                      value={technicianId}
                      onChange={(e) => setTechnicianId(e.target.value)}
                      disabled={loadingTechnicians}
                      className={controlClassName}
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

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Este campo es opcional y puede ajustarse después.
                    </p>
                  </div>

                  <OperationalZoneSelect
                    value={operationalZoneId}
                    countryCode={businessCountryCode}
                    label="Zona operativa"
                    helperText="Por defecto se toma de la instalación seleccionada. Puede ajustarse si este mantenimiento debe procesarse en otra zona."
                    onChange={setOperationalZoneId}
                  />
                </div>

                <div>
                  <label className={labelClassName}>Motivo o detalle</label>

                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Ejemplo: revisión preventiva, limpieza, ajuste o control de garantía"
                    className={`${textareaClassName} min-h-24`}
                  />
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-200 pt-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Información comercial
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Campos opcionales para preparar el mantenimiento para
                    facturación.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClassName}>
                      Tipo de mantenimiento
                    </label>

                    <select
                      value={maintenanceType}
                      onChange={(e) => setMaintenanceType(e.target.value)}
                      className={controlClassName}
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
                    <label className={labelClassName}>
                      Estado de facturación
                    </label>

                    <select
                      value={billingStatus}
                      onChange={(e) => setBillingStatus(e.target.value)}
                      className={controlClassName}
                    >
                      {billingStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClassName}>Monto estimado</label>

                    <input
                      type="number"
                      min="0"
                      value={estimatedAmount}
                      onChange={(e) => setEstimatedAmount(e.target.value)}
                      placeholder="Ej: 50000"
                      className={controlClassName}
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Costo interno</label>

                    <input
                      type="number"
                      min="0"
                      value={costAmount}
                      onChange={(e) => setCostAmount(e.target.value)}
                      placeholder="Ej: 30000"
                      className={controlClassName}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>Notas de facturación</label>

                  <textarea
                    value={billingNotes}
                    onChange={(e) => setBillingNotes(e.target.value)}
                    rows={3}
                    placeholder="Notas internas para facturación, cobro o condiciones comerciales."
                    className={`${textareaClassName} min-h-20`}
                  />
                </div>
              </section>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <button
                  type="submit"
                  disabled={
                    loadingSubmit || loadingInstallations || loadingTechnicians
                  }
                  className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingSubmit ? "Guardando..." : "Crear mantenimiento"}
                </button>

                <Link
                  href="/follow-ups"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Resumen
              </p>

              {selectedInstallation ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {getClientName(selectedInstallation.client)}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {selectedInstallation.description ||
                        "Instalación sin descripción"}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <SummaryRow
                      label="Fecha de instalación"
                      value={formatDateLabel(
                        selectedInstallation.installation_date,
                        businessLocale,
                      )}
                    />

                    <SummaryRow
                      label="Zona operativa"
                      value={
                        operationalZoneId
                          ? "Zona asignada"
                          : "Sin zona operativa"
                      }
                    />

                    <SummaryRow
                      label="Técnico asignado"
                      value={
                        selectedTechnician
                          ? getTechnicianName(selectedTechnician)
                          : "Sin técnico asignado"
                      }
                    />

                    <SummaryRow
                      label="Tipo"
                      value={getOptionLabel(
                        maintenanceTypeOptions,
                        maintenanceType,
                      )}
                    />

                    <SummaryRow
                      label="Facturación"
                      value={getOptionLabel(
                        billingStatusOptions,
                        billingStatus,
                      )}
                    />

                    <SummaryRow
                      label="Monto estimado"
                      value={formatMoneyPreview(
                        estimatedAmount,
                        businessCurrency,
                        businessLocale,
                      )}
                    />

                    <SummaryRow
                      label="Costo interno"
                      value={formatMoneyPreview(
                        costAmount,
                        businessCurrency,
                        businessLocale,
                      )}
                      last
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Selecciona una instalación para ver el resumen del
                  mantenimiento.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Nota
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Este formulario crea el mantenimiento directamente en el listado
                general. Los datos comerciales y el técnico asignado son
                opcionales y pueden ajustarse después desde el detalle del
                mantenimiento.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
