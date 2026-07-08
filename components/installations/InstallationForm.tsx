"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { provincias } from "@/lib/data/costa-rica-locations";
import InstallationCommercialSection from "./InstallationCommercialSection";
import OperationalZoneSelect from "@/app/settings/components/OperationalZoneSelect";
import {
  fallbackCountryPreset,
  type AppSettingsResponse,
  type InstallationFormProps,
  type TechnicianOption,
  type CountryPreset,
} from "./installation-form/installationFormConfig";
import {
  formatTechnicianName,
  getBusinessCountryPreset,
  isCostaRicaPreset,
} from "./installation-form/installationFormUtils";
import { FormSection } from "./installation-form/FormSection";
import { RoleBadge } from "./installation-form/RoleBadge";

export default function InstallationForm({
  mode,
  initialData = null,
}: InstallationFormProps) {
  const router = useRouter();

  const [businessCountryPreset, setBusinessCountryPreset] =
    useState<CountryPreset>(fallbackCountryPreset);

  const [description, setDescription] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");

  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [billingStatus, setBillingStatus] = useState("PENDING");
  const [billingNotes, setBillingNotes] = useState("");
  const [installationStatus, setInstallationStatus] = useState("OPEN");
  const [operationalZoneId, setOperationalZoneId] = useState("");

  const [addressLine, setAddressLine] = useState("");
  const [adminLevel1, setAdminLevel1] = useState("");
  const [adminLevel2, setAdminLevel2] = useState("");
  const [adminLevel3, setAdminLevel3] = useState("");

  const [locationNotes, setLocationNotes] = useState("");
  const [referencePoint, setReferencePoint] = useState("");

  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

        const countryPreset = getBusinessCountryPreset(
          result.data?.country_code,
        );

        if (!isMounted) return;

        setBusinessCountryPreset(countryPreset);
      } catch {
        // Keep the configured country preset defaults if system settings cannot be loaded.
      }
    }

    void loadBusinessSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialData) return;

    setDescription(initialData.description ?? "");
    setTechnicianName(initialData.technician_name ?? "");
    setTechnicianId(initialData.technician_id ?? "");
    setWarrantyMonths(
      initialData.warranty_months !== null &&
        initialData.warranty_months !== undefined
        ? String(initialData.warranty_months)
        : "",
    );
    setEstimatedAmount(
      initialData.estimated_amount !== null &&
        initialData.estimated_amount !== undefined
        ? String(initialData.estimated_amount)
        : "",
    );
    setCostAmount(
      initialData.cost_amount !== null && initialData.cost_amount !== undefined
        ? String(initialData.cost_amount)
        : "",
    );
    setBillingStatus(initialData.billing_status ?? "PENDING");
    setBillingNotes(initialData.billing_notes ?? "");
    setInstallationStatus(initialData.installation_status ?? "OPEN");
    setOperationalZoneId(initialData.operational_zone_id ?? "");
    setAddressLine(initialData.address_line ?? "");
    setAdminLevel1(initialData.admin_level_1 ?? "");
    setAdminLevel2(initialData.admin_level_2 ?? "");
    setAdminLevel3(initialData.admin_level_3 ?? "");
    setLocationNotes(initialData.location_notes ?? "");
    setReferencePoint(initialData.reference_point ?? "");
  }, [initialData]);

  useEffect(() => {
    async function loadTechnicians() {
      setLoadingTechnicians(true);

      try {
        const res = await fetch("/api/users?role=TECHNICIAN&is_active=true", {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success || !Array.isArray(result.data)) {
          setTechnicians([]);
          return;
        }

        setTechnicians(result.data);
      } catch {
        setTechnicians([]);
      } finally {
        setLoadingTechnicians(false);
      }
    }

    loadTechnicians();
  }, []);

  const shouldUseCostaRicaLocationCatalog = isCostaRicaPreset(
    businessCountryPreset,
  );

  const adminLevel3Label =
    businessCountryPreset.adminLevel3Label ?? "Nivel administrativo 3";

  const provinciaOptions = useMemo(
    () =>
      shouldUseCostaRicaLocationCatalog
        ? provincias.map((provincia) => provincia.nombre)
        : [],
    [shouldUseCostaRicaLocationCatalog],
  );

  const cantonOptions = useMemo(() => {
    if (!shouldUseCostaRicaLocationCatalog) return [];

    const provinciaSeleccionada = provincias.find(
      (provincia) => provincia.nombre === adminLevel1,
    );

    return provinciaSeleccionada?.cantones ?? [];
  }, [adminLevel1, shouldUseCostaRicaLocationCatalog]);

  const distritoOptions = useMemo(() => {
    if (!shouldUseCostaRicaLocationCatalog) return [];

    const cantonSeleccionado = cantonOptions.find(
      (canton) => canton.nombre === adminLevel2,
    );

    return cantonSeleccionado?.distritos ?? [];
  }, [adminLevel2, cantonOptions, shouldUseCostaRicaLocationCatalog]);

  const selectedTechnician = useMemo(() => {
    if (!technicianId) return initialData?.technician ?? null;

    return (
      technicians.find((technician) => technician.user_id === technicianId) ??
      initialData?.technician ??
      null
    );
  }, [technicianId, technicians, initialData?.technician]);

  const technicianDisplayName = useMemo(() => {
    if (selectedTechnician) {
      return formatTechnicianName(selectedTechnician);
    }

    return technicianName || "Sin asignar";
  }, [selectedTechnician, technicianName]);

  const locationSummary =
    adminLevel1 || adminLevel2 || adminLevel3
      ? [adminLevel1, adminLevel2, adminLevel3].filter(Boolean).join(" · ")
      : "Pendiente";

  const summaryCards = [
    {
      label: "Estado",
      value:
        installationStatus === "OPEN"
          ? "Abierta"
          : installationStatus === "IN_PROGRESS"
            ? "En proceso"
            : installationStatus === "CLOSED"
              ? "Completada"
              : installationStatus === "CANCELLED"
                ? "Cancelada"
                : "Sin definir",
    },
    {
      label: "Técnico",
      value: technicianDisplayName,
    },
    {
      label: "Facturación",
      value:
        billingStatus === "PENDING"
          ? "Pendiente"
          : billingStatus === "INVOICED"
            ? "Facturado"
            : billingStatus === "PAID"
              ? "Pagado"
              : billingStatus === "PARTIALLY_PAID"
                ? "Parcial"
                : billingStatus === "NOT_BILLABLE"
                  ? "No facturable"
                  : "Sin definir",
    },
    {
      label: "Ubicación",
      value: locationSummary,
    },
  ];

  function handleProvinceChange(value: string) {
    setAdminLevel1(value);
    setAdminLevel2("");
    setAdminLevel3("");
  }

  function handleCantonChange(value: string) {
    setAdminLevel2(value);
    setAdminLevel3("");
  }

  function handleBack() {
    if (mode === "edit" && initialData?.installation_id) {
      router.push(`/installations/${initialData.installation_id}`);
      return;
    }

    router.push("/installations");
  }

  function handleTechnicianSelect(value: string) {
    setTechnicianId(value);

    if (!value) {
      setTechnicianId("");
      return;
    }

    const foundTechnician = technicians.find(
      (technician) => technician.user_id === value,
    );

    if (foundTechnician) {
      setTechnicianName(formatTechnicianName(foundTechnician));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const endpoint =
        mode === "create"
          ? "/api/installations"
          : `/api/installations/${initialData?.installation_id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        description: description || null,
        technician_name: technicianName || null,
        technician_id: technicianId || null,
        warranty_months: warrantyMonths ? Number(warrantyMonths) : null,
        estimated_amount: estimatedAmount ? Number(estimatedAmount) : null,
        cost_amount: costAmount ? Number(costAmount) : null,
        billing_status: billingStatus || "PENDING",
        billing_notes: billingNotes || null,
        ...(mode === "edit" && {
          installation_status: installationStatus || "OPEN",
        }),
        operational_zone_id: operationalZoneId || null,
        address_line: addressLine || null,
        admin_level_1: adminLevel1 || null,
        admin_level_2: adminLevel2 || null,
        admin_level_3: adminLevel3 || null,
        location_notes: locationNotes || null,
        reference_point: referencePoint || null,
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          ...(mode === "edit" && {
            changed_by: "demo-user",
          }),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message ||
            (mode === "create"
              ? "No se pudo crear la instalación"
              : "No se pudo actualizar la instalación"),
        );
      }

      setMessage(
        mode === "create"
          ? "Instalación creada correctamente"
          : "Instalación actualizada correctamente",
      );

      setTimeout(() => {
        if (mode === "create") {
          router.push("/installations");
          return;
        }

        if (initialData?.installation_id) {
          router.push(`/installations/${initialData.installation_id}`);
          return;
        }

        router.push("/installations");
      }, 700);
    } catch {
      setError(
        mode === "create"
          ? "No se pudo crear la instalación"
          : "No se pudo actualizar la instalación",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

  const selectClass =
    "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

  const textareaClass =
    "min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6 xl:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm">
              Instalaciones
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {mode === "create"
                  ? "Registrar instalación"
                  : "Actualizar instalación"}
              </h1>
              <p className="text-sm leading-6 text-slate-500">
                Actualizá la información principal, ubicación, facturación y
                personal asignado de la instalación.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Volver
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit}>
            <FormSection
              title="Información general"
              description="Datos básicos, garantía y estado de la instalación."
            >
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Descripción
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                  placeholder="Descripción de la instalación"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Meses de garantía
                </label>
                <input
                  type="number"
                  min="0"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: 12"
                />
              </div>

              {mode === "edit" ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Estado de instalación
                  </label>
                  <select
                    value={installationStatus}
                    onChange={(e) => setInstallationStatus(e.target.value)}
                    className={selectClass}
                  >
                    <option value="OPEN">Abierta</option>
                    <option value="IN_PROGRESS">En proceso</option>
                    <option value="CLOSED">Completada</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              ) : null}
            </FormSection>

            <FormSection
              title="Información comercial"
              description="Precio, costo y estado de facturación."
              badge={businessCountryPreset.primaryCurrency}
            >
              <div className="md:col-span-2">
                <InstallationCommercialSection
                  estimatedAmount={estimatedAmount}
                  setEstimatedAmount={setEstimatedAmount}
                  costAmount={costAmount}
                  setCostAmount={setCostAmount}
                  billingStatus={billingStatus}
                  setBillingStatus={setBillingStatus}
                  billingNotes={billingNotes}
                  setBillingNotes={setBillingNotes}
                  currencyCode={businessCountryPreset.primaryCurrency}
                />
              </div>
            </FormSection>

            <FormSection
              title="Personal asignado"
              description="Asocia un técnico real o conserva un respaldo manual."
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Técnico asignado
                </label>
                <select
                  value={technicianId}
                  onChange={(e) => handleTechnicianSelect(e.target.value)}
                  className={selectClass}
                  disabled={loadingTechnicians}
                >
                  <option value="">
                    {loadingTechnicians
                      ? "Cargando técnicos..."
                      : technicians.length === 0
                        ? "No hay técnicos disponibles"
                        : "Seleccione técnico"}
                  </option>

                  {technicians.map((technician) => (
                    <option key={technician.user_id} value={technician.user_id}>
                      {formatTechnicianName(technician)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Respaldo manual
                </label>
                <input
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className={inputClass}
                  placeholder="Nombre visible del técnico"
                />
              </div>

              <div className="md:col-span-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Vista previa del técnico
                  </p>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p
                      className={`text-sm font-semibold ${
                        technicianDisplayName === "Sin asignar"
                          ? "text-slate-400"
                          : "text-slate-900"
                      }`}
                    >
                      {technicianDisplayName}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {selectedTechnician?.role ? (
                        <RoleBadge role={selectedTechnician.role} />
                      ) : null}

                      {selectedTechnician ? (
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                            selectedTechnician.is_active === false
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-blue-200 bg-blue-50 text-blue-700"
                          }`}
                        >
                          {selectedTechnician.is_active === false
                            ? "Inactivo"
                            : "Asignado"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Ubicación"
              description="Dirección operativa, zona y referencias de la instalación."
            >
              <div className="md:col-span-2">
                <OperationalZoneSelect
                  value={operationalZoneId}
                  countryCode={businessCountryPreset.countryCode}
                  label="Zona operativa"
                  helperText="Seleccione la zona operativa de esta instalación. Esta información será usada por el motor de disponibilidad para agrupar trabajos por zona."
                  onChange={setOperationalZoneId}
                />
              </div>

              {shouldUseCostaRicaLocationCatalog ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {businessCountryPreset.adminLevel1Label}
                    </label>
                    <select
                      value={adminLevel1}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">
                        Seleccione{" "}
                        {businessCountryPreset.adminLevel1Label.toLowerCase()}
                      </option>
                      {provinciaOptions.map((provincia) => (
                        <option key={provincia} value={provincia}>
                          {provincia}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {businessCountryPreset.adminLevel2Label}
                    </label>
                    <select
                      value={adminLevel2}
                      onChange={(e) => handleCantonChange(e.target.value)}
                      disabled={!adminLevel1}
                      className={selectClass}
                    >
                      <option value="">
                        Seleccione{" "}
                        {businessCountryPreset.adminLevel2Label.toLowerCase()}
                      </option>
                      {cantonOptions.map((canton) => (
                        <option key={canton.nombre} value={canton.nombre}>
                          {canton.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {adminLevel3Label}
                    </label>
                    <select
                      value={adminLevel3}
                      onChange={(e) => setAdminLevel3(e.target.value)}
                      disabled={!adminLevel1 || !adminLevel2}
                      className={selectClass}
                    >
                      <option value="">
                        Seleccione {adminLevel3Label.toLowerCase()}
                      </option>
                      {distritoOptions.map((distrito) => (
                        <option key={distrito.nombre} value={distrito.nombre}>
                          {distrito.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {businessCountryPreset.adminLevel1Label}
                    </label>
                    <input
                      value={adminLevel1}
                      onChange={(e) => setAdminLevel1(e.target.value)}
                      className={inputClass}
                      placeholder={businessCountryPreset.adminLevel1Label}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {businessCountryPreset.adminLevel2Label}
                    </label>
                    <input
                      value={adminLevel2}
                      onChange={(e) => setAdminLevel2(e.target.value)}
                      className={inputClass}
                      placeholder={businessCountryPreset.adminLevel2Label}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {adminLevel3Label}
                    </label>
                    <input
                      value={adminLevel3}
                      onChange={(e) => setAdminLevel3(e.target.value)}
                      className={inputClass}
                      placeholder={adminLevel3Label}
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Dirección
                </label>
                <input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className={inputClass}
                  placeholder="Dirección exacta de la instalación"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Punto de referencia
                </label>
                <input
                  value={referencePoint}
                  onChange={(e) => setReferencePoint(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: entrada principal, edificio, local o referencia cercana"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notas de ubicación
                </label>
                <textarea
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  className={textareaClass}
                  placeholder="Detalles adicionales de ubicación"
                />
              </div>
            </FormSection>

            <div className="space-y-3 px-4 pt-4">
              {message ? (
                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : mode === "create"
                    ? "Guardar instalación"
                    : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
