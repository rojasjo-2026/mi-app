"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { provincias } from "@/lib/data/costa-rica-locations";
import InstallationCommercialSection from "./InstallationCommercialSection";
import InstallationCoordinatesSection from "./InstallationCoordinatesSection";
import ServiceTypeSelect from "./ServiceTypeSelect";
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

function formatDateForInput(value?: string | null) {
  if (!value) return "";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value.slice(0, 10);
  }

  return parsedDate.toISOString().slice(0, 10);
}

function normalizeSensitiveValue(value?: string | number | null) {
  if (value === null || value === undefined) return "";

  return String(value).trim();
}

function getInstallationStatusConfirmLabel(status?: string | null) {
  if (status === "OPEN") return "Abierta";
  if (status === "IN_PROGRESS") return "En proceso";
  if (status === "CLOSED") return "Completada";
  if (status === "CANCELLED") return "Cancelada";

  return status || "Sin definir";
}

function getConfirmDisplayValue(value?: string | number | null) {
  const normalizedValue = normalizeSensitiveValue(value);

  return normalizedValue || "Sin definir";
}

function buildSensitiveChangeDescription(
  label: string,
  previousValue?: string | number | null,
  nextValue?: string | number | null,
) {
  return `${label}: ${getConfirmDisplayValue(
    previousValue,
  )} → ${getConfirmDisplayValue(nextValue)}`;
}

type WarrantyPreview = {
  title: string;
  description: string;
  tone: "neutral" | "valid" | "warning" | "expired";
};

function parseDateOnly(value?: string | null) {
  if (!value) return null;

  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) return null;

  const parsedDate = new Date(year, month - 1, day);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function addMonthsToDate(date: Date, months: number) {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setMonth(result.getMonth() + months);

  if (result.getDate() !== originalDay) {
    result.setDate(0);
  }

  return result;
}

function getStartOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getWholeMonthsBetween(startDate: Date, endDate: Date) {
  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (endDate.getDate() < startDate.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

function formatWarrantyDate(date: Date) {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatWarrantyMonthCount(months: number) {
  return months === 1 ? "1 mes" : `${months} meses`;
}

function getWarrantyPreview(
  installationDate: string,
  warrantyMonths: string,
): WarrantyPreview {
  const normalizedWarrantyMonths = warrantyMonths.trim();

  if (!normalizedWarrantyMonths) {
    return {
      title: "Sin garantía configurada",
      description:
        "Ingrese los meses de garantía para calcular el vencimiento.",
      tone: "neutral",
    };
  }

  const warrantyMonthsValue = Number(normalizedWarrantyMonths);

  if (
    !Number.isFinite(warrantyMonthsValue) ||
    !Number.isInteger(warrantyMonthsValue) ||
    warrantyMonthsValue < 0
  ) {
    return {
      title: "Garantía inválida",
      description: "Ingrese una cantidad válida de meses.",
      tone: "warning",
    };
  }

  if (warrantyMonthsValue === 0) {
    return {
      title: "Sin garantía configurada",
      description: "0 meses no genera un período de garantía.",
      tone: "neutral",
    };
  }

  const parsedInstallationDate = parseDateOnly(installationDate);

  if (!parsedInstallationDate) {
    return {
      title: "Fecha pendiente",
      description:
        "Seleccione la fecha de instalación para calcular la garantía.",
      tone: "neutral",
    };
  }

  const warrantyExpirationDate = addMonthsToDate(
    parsedInstallationDate,
    warrantyMonthsValue,
  );

  const today = getStartOfToday();
  const installationLabel = formatWarrantyDate(parsedInstallationDate);
  const expirationLabel = formatWarrantyDate(warrantyExpirationDate);

  if (parsedInstallationDate > today) {
    return {
      title: "Garantía pendiente",
      description: `Inicia el ${installationLabel} · Vence el ${expirationLabel} · Duración ${formatWarrantyMonthCount(
        warrantyMonthsValue,
      )}`,
      tone: "neutral",
    };
  }

  if (warrantyExpirationDate < today) {
    const expiredMonths = getWholeMonthsBetween(warrantyExpirationDate, today);

    return {
      title: "Garantía vencida",
      description:
        expiredMonths > 0
          ? `Venció el ${expirationLabel} · Hace ${formatWarrantyMonthCount(
              expiredMonths,
            )}`
          : `Venció el ${expirationLabel} · Hace menos de 1 mes`,
      tone: "expired",
    };
  }

  const remainingMonths = getWholeMonthsBetween(today, warrantyExpirationDate);

  if (remainingMonths === 0) {
    return {
      title: "Garantía vigente",
      description: `Vence el ${expirationLabel} · Queda menos de 1 mes`,
      tone: "warning",
    };
  }

  return {
    title: "Garantía vigente",
    description: `Vence el ${expirationLabel} · Quedan ${formatWarrantyMonthCount(
      remainingMonths,
    )}`,
    tone: remainingMonths <= 2 ? "warning" : "valid",
  };
}

function getWarrantyPreviewClass(tone: WarrantyPreview["tone"]) {
  if (tone === "valid") {
    return "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800";
  }

  if (tone === "warning") {
    return "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800";
  }

  if (tone === "expired") {
    return "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800";
  }

  return "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700";
}

export default function InstallationForm({
  mode,
  initialData = null,
}: InstallationFormProps) {
  const router = useRouter();
  const [businessCountryPreset, setBusinessCountryPreset] =
    useState<CountryPreset>(fallbackCountryPreset);

  const [description, setDescription] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [installationDate, setInstallationDate] = useState("");
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

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);

  const [locationNotes, setLocationNotes] = useState("");
  const [referencePoint, setReferencePoint] = useState("");

  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [openSections, setOpenSections] = useState({
    general: true,
    commercial: false,
    staff: false,
    location: false,
    coordinates: false,
  });

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function openRequiredSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [section]: true,
    }));
  }

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
    setServiceTypeId(
      initialData.service_type_id !== null &&
        initialData.service_type_id !== undefined
        ? String(initialData.service_type_id)
        : "",
    );
    setInstallationDate(formatDateForInput(initialData.installation_date));
    setLatitude(
      initialData.latitude !== null && initialData.latitude !== undefined
        ? String(initialData.latitude)
        : "",
    );
    setLongitude(
      initialData.longitude !== null && initialData.longitude !== undefined
        ? String(initialData.longitude)
        : "",
    );
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

  const warrantyPreview = useMemo(
    () => getWarrantyPreview(installationDate, warrantyMonths),
    [installationDate, warrantyMonths],
  );

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

  function handleUseCurrentLocation() {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("Este navegador no soporta geolocalización");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setMessage("Coordenadas actualizadas correctamente.");
        setLocating(false);
      },
      () => {
        setError("No se pudo obtener la ubicación actual");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  function validateCoordinates() {
    const hasLatitudeValue = latitude.trim() !== "";
    const hasLongitudeValue = longitude.trim() !== "";

    if (hasLatitudeValue !== hasLongitudeValue) {
      return "Debe ingresar latitud y longitud, o dejar ambas vacías.";
    }

    if (!hasLatitudeValue && !hasLongitudeValue) {
      return "";
    }

    const latitudeValue = Number(latitude);
    const longitudeValue = Number(longitude);

    if (
      Number.isNaN(latitudeValue) ||
      latitudeValue < -90 ||
      latitudeValue > 90
    ) {
      return "La latitud debe estar entre -90 y 90.";
    }

    if (
      Number.isNaN(longitudeValue) ||
      longitudeValue < -180 ||
      longitudeValue > 180
    ) {
      return "La longitud debe estar entre -180 y 180.";
    }

    return "";
  }

  function getSensitiveChangeDescriptions() {
    if (mode !== "edit" || !initialData) {
      return [];
    }

    const changes: string[] = [];

    const initialInstallationDate = formatDateForInput(
      initialData.installation_date,
    );

    if (installationDate !== initialInstallationDate) {
      changes.push(
        buildSensitiveChangeDescription(
          "Fecha de instalación",
          initialInstallationDate,
          installationDate,
        ),
      );
    }

    if (
      normalizeSensitiveValue(operationalZoneId) !==
      normalizeSensitiveValue(initialData.operational_zone_id)
    ) {
      changes.push(
        buildSensitiveChangeDescription(
          "Zona operativa",
          initialData.operational_zone_id,
          operationalZoneId,
        ),
      );
    }

    const initialInstallationStatus = initialData.installation_status ?? "OPEN";

    if (
      normalizeSensitiveValue(installationStatus) !==
      normalizeSensitiveValue(initialInstallationStatus)
    ) {
      changes.push(
        buildSensitiveChangeDescription(
          "Estado de instalación",
          getInstallationStatusConfirmLabel(initialInstallationStatus),
          getInstallationStatusConfirmLabel(installationStatus),
        ),
      );
    }

    const latitudeChanged =
      normalizeSensitiveValue(latitude) !==
      normalizeSensitiveValue(initialData.latitude);

    const longitudeChanged =
      normalizeSensitiveValue(longitude) !==
      normalizeSensitiveValue(initialData.longitude);

    if (latitudeChanged || longitudeChanged) {
      const previousCoordinates = [
        normalizeSensitiveValue(initialData.latitude),
        normalizeSensitiveValue(initialData.longitude),
      ]
        .filter(Boolean)
        .join(", ");

      const nextCoordinates = [
        normalizeSensitiveValue(latitude),
        normalizeSensitiveValue(longitude),
      ]
        .filter(Boolean)
        .join(", ");

      changes.push(
        buildSensitiveChangeDescription(
          "Coordenadas GPS",
          previousCoordinates,
          nextCoordinates,
        ),
      );
    }

    return changes;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!serviceTypeId) {
      openRequiredSection("general");
      setError("Seleccione un tipo de servicio.");
      return;
    }

    if (!installationDate) {
      openRequiredSection("general");
      setError("Seleccione la fecha de instalación.");
      return;
    }

    const coordinateValidationError = validateCoordinates();

    if (coordinateValidationError) {
      openRequiredSection("coordinates");
      setError(coordinateValidationError);
      return;
    }

    const sensitiveChanges = getSensitiveChangeDescriptions();

    if (sensitiveChanges.length > 0) {
      const shouldContinue = window.confirm(
        `Está por modificar datos operativos sensibles de esta instalación:\n\n${sensitiveChanges
          .map((change) => `- ${change}`)
          .join("\n")}\n\n¿Está seguro de continuar?`,
      );

      if (!shouldContinue) {
        return;
      }
    }

    setSaving(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/installations"
          : `/api/installations/${initialData?.installation_id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        description: description || null,
        service_type_id: Number(serviceTypeId),
        installation_date: installationDate,
        latitude: latitude || null,
        longitude: longitude || null,
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
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
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
              className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm"
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
          <form onSubmit={handleSubmit} className="p-6">
            <FormSection
              title="Información general"
              description="Datos básicos, fecha, garantía y estado de la instalación."
              isOpen={openSections.general}
              onToggle={() => toggleSection("general")}
            >
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={textareaClass}
                  placeholder="Descripción de la instalación"
                />
              </div>

              <div>
                <ServiceTypeSelect
                  value={serviceTypeId}
                  onChange={setServiceTypeId}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Fecha de instalación
                </label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Meses de garantía
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
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

              <div className="md:col-span-2">
                <div
                  className={`${getWarrantyPreviewClass(
                    warrantyPreview.tone,
                  )} w-full`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                    Garantía
                  </p>
                  <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <p className="text-sm font-semibold">
                      {warrantyPreview.title}
                    </p>
                    <p className="text-xs leading-5 sm:text-right">
                      {warrantyPreview.description}
                    </p>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Información comercial"
              description="Precio, costo y estado de facturación."
              badge={businessCountryPreset.primaryCurrency}
              isOpen={openSections.commercial}
              onToggle={() => toggleSection("commercial")}
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
              isOpen={openSections.staff}
              onToggle={() => toggleSection("staff")}
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
              isOpen={openSections.location}
              onToggle={() => toggleSection("location")}
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

            <FormSection
              title="Coordenadas GPS"
              description="Latitud y longitud para ubicación exacta si aplica."
              isOpen={openSections.coordinates}
              onToggle={() => toggleSection("coordinates")}
            >
              <div className="md:col-span-2">
                <InstallationCoordinatesSection
                  locating={locating}
                  latitude={latitude}
                  longitude={longitude}
                  handleUseCurrentLocation={handleUseCurrentLocation}
                  setLatitude={setLatitude}
                  setLongitude={setLongitude}
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

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
