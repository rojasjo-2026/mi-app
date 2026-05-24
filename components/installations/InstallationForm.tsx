"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { provincias } from "@/lib/data/costa-rica-locations";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
  type CountryPreset,
} from "@/lib/settings/countryPresets";
import InstallationCommercialSection from "./InstallationCommercialSection";
import OperationalZoneSelect from "@/app/settings/components/OperationalZoneSelect";

type TechnicianOption = {
  user_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  role?: "TECHNICIAN" | "SUPERVISOR" | "ADMINISTRATION" | "ADMIN" | string;
  is_active?: boolean | null;
};

type InstallationFormData = {
  installation_id?: string;
  description?: string | null;
  technician_name?: string | null;
  technician_id?: string | null;
  technician?: TechnicianOption | null;
  warranty_months?: number | string | null;
  estimated_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  installation_status?: string | null;
  operational_zone_id?: string | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  location_notes?: string | null;
  reference_point?: string | null;
};

type InstallationFormProps = {
  mode: "create" | "edit";
  initialData?: InstallationFormData | null;
};

type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
  } | null;
};

const DEFAULT_COUNTRY_CODE = "CR";

const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? Object.values(COUNTRY_PRESETS)[0];

function getBusinessCountryPreset(countryCode?: string | null): CountryPreset {
  return getCountryPreset(countryCode) ?? fallbackCountryPreset;
}

function isCostaRicaPreset(countryPreset: CountryPreset) {
  return countryPreset.countryCode === "CR";
}

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
        // Keep Costa Rica defaults if system settings cannot be loaded.
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
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400";

  const textareaClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                  {mode === "create"
                    ? "Nueva instalación"
                    : "Editar instalación"}
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                  {mode === "create"
                    ? "Registrar instalación"
                    : "Actualizar instalación"}
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Completa la información principal, ubicación y personal
                  asignado para mantener la instalación bien organizada.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                ← Volver
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 md:px-8">
            <FormSection
              title="Información general"
              description="Datos básicos de la instalación."
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

              {mode === "edit" && (
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
              )}
            </FormSection>

            <InstallationCommercialSection
              estimatedAmount={estimatedAmount}
              setEstimatedAmount={setEstimatedAmount}
              costAmount={costAmount}
              setCostAmount={setCostAmount}
              billingStatus={billingStatus}
              setBillingStatus={setBillingStatus}
              billingNotes={billingNotes}
              setBillingNotes={setBillingNotes}
            />

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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Vista previa del técnico
                  </p>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p
                      className={`text-sm font-semibold ${
                        technicianDisplayName === "Sin asignar"
                          ? "text-slate-400"
                          : "text-slate-800"
                      }`}
                    >
                      {technicianDisplayName}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {selectedTechnician?.role && (
                        <RoleBadge role={selectedTechnician.role} />
                      )}

                      {selectedTechnician && (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedTechnician.is_active === false
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {selectedTechnician.is_active === false
                            ? "Inactivo"
                            : "Asignado"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Ubicación"
              description="Información geográfica y referencias de la instalación."
            >
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">
                  País operativo
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {businessCountryPreset.countryName}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Este país viene de la Configuración del sistema y define los
                  nombres de ubicación usados para esta instalación.
                </p>
              </div>

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

                  <div className="md:col-span-2">
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

                  <div className="md:col-span-2">
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
                  rows={4}
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  className={textareaClass}
                  placeholder="Detalles adicionales de ubicación"
                />
              </div>
            </FormSection>

            {message && (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </p>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : mode === "create"
                    ? "Guardar instalación"
                    : "Guardar cambios"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {formatRole(role)}
    </span>
  );
}

function formatTechnicianName(technician: TechnicianOption) {
  return [technician.first_name, technician.last_name_1, technician.last_name_2]
    .filter(Boolean)
    .join(" ");
}

function formatRole(role?: string | null) {
  if (!role) return "-";

  if (role === "TECHNICIAN") return "Técnico";
  if (role === "SUPERVISOR") return "Supervisor";
  if (role === "ADMINISTRATION") return "Administración";
  if (role === "ADMIN") return "Admin";

  return role;
}
