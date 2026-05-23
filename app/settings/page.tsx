"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COUNTRY_PRESET_OPTIONS,
  COUNTRY_PRESETS,
  getCountryPreset,
  type CountryPreset,
  type CountryTimezoneOption,
} from "@/lib/settings/countryPresets";

import CalendarBlockedDatesManager from "@/app/settings/components/CalendarBlockedDatesManager";

type CurrencyCode = string;

type AppSettings = {
  settings_id: string;

  company_name: string | null;
  company_phone: string | null;
  company_email: string | null;

  country_code: string;
  country_name: string;

  admin_level_1_label: string;
  admin_level_2_label: string;
  admin_level_3_label: string | null;

  timezone: string;
  default_currency: CurrencyCode;
  default_tax_rate: number;

  whatsapp_enabled: boolean;
  auto_contact_enabled: boolean;
  maintenance_contact_days_before: number;
  automatic_send_hour: number;

  created_at: string;
  updated_at: string;
};

type SettingsForm = Omit<
  AppSettings,
  "settings_id" | "created_at" | "updated_at"
>;

type SettingsApiResponse = {
  success: boolean;
  data: AppSettings | null;
  message?: string;
};

const DEFAULT_COUNTRY_CODE = "CR";

const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? Object.values(COUNTRY_PRESETS)[0];

const currencyNames: Record<string, string> = {
  ARS: "Peso argentino",
  BOB: "Boliviano",
  BRL: "Real brasileño",
  CAD: "Dólar canadiense",
  CLP: "Peso chileno",
  COP: "Peso colombiano",
  CRC: "Colón costarricense",
  DOP: "Peso dominicano",
  EUR: "Euro",
  GTQ: "Quetzal guatemalteco",
  HNL: "Lempira hondureño",
  MXN: "Peso mexicano",
  NIO: "Córdoba nicaragüense",
  PEN: "Sol peruano",
  PYG: "Guaraní paraguayo",
  USD: "Dólar estadounidense",
  UYU: "Peso uruguayo",
  VES: "Bolívar venezolano",
  XAF: "Franco CFA de África Central",
};

const currencyOptions = Array.from(
  new Set(
    Object.values(COUNTRY_PRESETS).flatMap((preset) =>
      [preset.primaryCurrency, preset.secondaryCurrency].filter(Boolean),
    ),
  ),
)
  .map((currency) => String(currency))
  .sort();

const taxModeLabels: Record<CountryPreset["taxMode"], string> = {
  NATIONAL: "Nacional",
  REGIONAL: "Regional",
  MIXED: "Mixto",
  NONE: "Sin impuesto",
};

const futureSections = [
  {
    title: "Operación y agenda",
    description:
      "Controle horarios laborales, días no disponibles y reglas operativas del calendario.",
    items: [
      "Horario laboral",
      "Días no laborables",
      "Reglas de agenda",
      "Bloqueos de calendario",
      "Asignación operativa",
    ],
  },
  {
    title: "Accesos y permisos",
    description:
      "Administre usuarios, roles y permisos relacionados con el uso del sistema.",
    items: ["Usuarios activos", "Roles", "Permisos", "Accesos administrativos"],
  },
];

function buildDefaultFormFromPreset(preset: CountryPreset): SettingsForm {
  return {
    company_name: "",
    company_phone: "",
    company_email: "",

    country_code: preset.countryCode,
    country_name: preset.countryName,

    admin_level_1_label: preset.adminLevel1Label,
    admin_level_2_label: preset.adminLevel2Label,
    admin_level_3_label: preset.adminLevel3Label ?? "",

    timezone: preset.defaultTimezone,
    default_currency: preset.primaryCurrency,
    default_tax_rate: preset.defaultTaxRate,

    whatsapp_enabled: false,
    auto_contact_enabled: true,
    maintenance_contact_days_before: 22,
    automatic_send_hour: 9,
  };
}

const defaultForm = buildDefaultFormFromPreset(fallbackCountryPreset);

function normalizeCountryCode(value: string | null | undefined) {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  if (normalizedValue === "COSTA RICA") {
    return "CR";
  }

  return getCountryPreset(normalizedValue)?.countryCode ?? DEFAULT_COUNTRY_CODE;
}

function getCountryByCode(countryCode: string | null | undefined) {
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  return getCountryPreset(normalizedCountryCode) ?? fallbackCountryPreset;
}

function getTimezoneOptions(
  preset: CountryPreset,
  currentTimezone: string,
): CountryTimezoneOption[] {
  const hasCurrentTimezone = preset.timezones.some(
    (timezoneOption) => timezoneOption.value === currentTimezone,
  );

  if (!currentTimezone || hasCurrentTimezone) {
    return preset.timezones;
  }

  return [
    ...preset.timezones,
    {
      value: currentTimezone,
      label: `Personalizada - ${currentTimezone}`,
    },
  ];
}

function mapSettingsToForm(settings: AppSettings): SettingsForm {
  const countryCode = normalizeCountryCode(settings.country_code);
  const country = getCountryByCode(countryCode);

  return {
    company_name: settings.company_name || "",
    company_phone: settings.company_phone || "",
    company_email: settings.company_email || "",

    country_code: country.countryCode,
    country_name: country.countryName,

    admin_level_1_label:
      settings.admin_level_1_label || country.adminLevel1Label,
    admin_level_2_label:
      settings.admin_level_2_label || country.adminLevel2Label,
    admin_level_3_label:
      settings.admin_level_3_label || country.adminLevel3Label || "",

    timezone: settings.timezone || country.defaultTimezone,
    default_currency: settings.default_currency || country.primaryCurrency,
    default_tax_rate: settings.default_tax_rate ?? country.defaultTaxRate,

    whatsapp_enabled: settings.whatsapp_enabled,
    auto_contact_enabled: settings.auto_contact_enabled,
    maintenance_contact_days_before:
      settings.maintenance_contact_days_before ?? 22,
    automatic_send_hour: settings.automatic_send_hour ?? 9,
  };
}

function applyCountryPresetToForm(
  currentForm: SettingsForm,
  preset: CountryPreset,
): SettingsForm {
  return {
    ...currentForm,
    country_code: preset.countryCode,
    country_name: preset.countryName,
    timezone: preset.defaultTimezone,
    default_currency: preset.primaryCurrency,
    default_tax_rate: preset.defaultTaxRate,
    admin_level_1_label: preset.adminLevel1Label,
    admin_level_2_label: preset.adminLevel2Label,
    admin_level_3_label: preset.adminLevel3Label ?? "",
  };
}

function buildSettingsPayload(form: SettingsForm) {
  const country = getCountryByCode(form.country_code);

  return {
    ...form,
    country_code: country.countryCode,
    country_name: country.countryName,
  };
}

export default function SettingsPage() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [countryPresetMessage, setCountryPresetMessage] = useState("");
  const [activeOperationSection, setActiveOperationSection] = useState<
    string | null
  >("Bloqueos de calendario");

  const selectedCountryPreset = useMemo(
    () => getCountryByCode(form.country_code),
    [form.country_code],
  );

  const timezoneOptions = useMemo(
    () => getTimezoneOptions(selectedCountryPreset, form.timezone),
    [form.timezone, selectedCountryPreset],
  );

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/settings", {
        cache: "no-store",
      });

      const result: SettingsApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "No se pudo cargar la configuración.",
        );
      }

      setSettingsId(result.data.settings_id);
      setForm(mapSettingsToForm(result.data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar la configuración.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildSettingsPayload(form)),
      });

      const result: SettingsApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "No se pudo guardar la configuración.",
        );
      }

      setSettingsId(result.data.settings_id);
      setForm(mapSettingsToForm(result.data));
      setSuccessMessage("Configuración guardada correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al guardar la configuración.",
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Configuración
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Configuración del sistema
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Centralice las reglas generales de la empresa, automatizaciones,
              ubicación, moneda, impuestos, horarios y accesos. Estas
              configuraciones servirán como base para adaptar el sistema al
              entorno operativo de cada negocio.
            </p>

            {settingsId && (
              <p className="mt-3 text-xs text-slate-400">
                Registro activo: {settingsId}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Configuración general
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Defina los datos base de la empresa, ubicación, moneda, impuestos y
            zona horaria. Al seleccionar un país, CLARIUS sugerirá valores
            regionales que pueden modificarse manualmente.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nombre de la empresa
              </span>
              <input
                value={form.company_name || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    company_name: event.target.value,
                  }))
                }
                placeholder="Ej. Mi empresa"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Teléfono de la empresa
              </span>
              <input
                value={form.company_phone || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    company_phone: event.target.value,
                  }))
                }
                placeholder={`Ej. ${selectedCountryPreset.phoneExample}`}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Correo de la empresa
              </span>
              <input
                value={form.company_email || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    company_email: event.target.value,
                  }))
                }
                placeholder="correo@empresa.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Código de país
              </span>
              <select
                value={form.country_code}
                onChange={(event) => {
                  const selectedCountry = getCountryByCode(event.target.value);

                  setForm((current) =>
                    applyCountryPresetToForm(current, selectedCountry),
                  );

                  setCountryPresetMessage(
                    `Se aplicaron valores sugeridos para ${selectedCountry.countryName}. Puede ajustar moneda, impuesto, zona horaria y niveles administrativos antes de guardar.`,
                  );
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                {COUNTRY_PRESET_OPTIONS.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Se usa para sugerir reglas regionales, formatos, moneda,
                impuestos y zona horaria.
              </p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">País</span>
              <input
                value={form.country_name}
                readOnly
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
              />
            </label>

            {countryPresetMessage && (
              <div className="md:col-span-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
                {countryPresetMessage}
              </div>
            )}

            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-800">
                Valores sugeridos por país
              </p>

              <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <span className="font-semibold text-slate-700">
                    Prefijo telefónico:
                  </span>{" "}
                  {selectedCountryPreset.phonePrefix}
                </div>

                <div>
                  <span className="font-semibold text-slate-700">
                    Ejemplo teléfono:
                  </span>{" "}
                  {selectedCountryPreset.phoneExample}
                </div>

                <div>
                  <span className="font-semibold text-slate-700">
                    Moneda principal:
                  </span>{" "}
                  {selectedCountryPreset.primaryCurrency}{" "}
                  {selectedCountryPreset.currencySymbol}
                </div>

                <div>
                  <span className="font-semibold text-slate-700">
                    Moneda secundaria:
                  </span>{" "}
                  {selectedCountryPreset.secondaryCurrency || "No definida"}
                </div>

                <div>
                  <span className="font-semibold text-slate-700">
                    Formato regional:
                  </span>{" "}
                  {selectedCountryPreset.locale}
                </div>

                <div>
                  <span className="font-semibold text-slate-700">
                    Formato de fecha:
                  </span>{" "}
                  {selectedCountryPreset.dateFormat}
                </div>

                <div>
                  <span className="font-semibold text-slate-700">
                    Impuesto sugerido:
                  </span>{" "}
                  {selectedCountryPreset.taxLabel}{" "}
                  {selectedCountryPreset.defaultTaxRate}%
                </div>

                <div>
                  <span className="font-semibold text-slate-700">
                    Modo de impuesto:
                  </span>{" "}
                  {taxModeLabels[selectedCountryPreset.taxMode]}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Validación y datos regionales
                </p>

                <div className="mt-3 grid gap-4 text-xs text-slate-600 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <span className="font-semibold text-slate-700">
                      Tipos de identificación:
                    </span>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedCountryPreset.identificationTypes.map(
                        (identificationType) => (
                          <span
                            key={identificationType.code}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600"
                          >
                            {identificationType.label}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">
                      Ejemplo de dirección:
                    </span>{" "}
                    {selectedCountryPreset.addressExample}
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">
                      Teléfono:
                    </span>{" "}
                    {selectedCountryPreset.phoneValidation.minDigits ===
                    selectedCountryPreset.phoneValidation.maxDigits
                      ? `${selectedCountryPreset.phoneValidation.minDigits} dígitos`
                      : `${selectedCountryPreset.phoneValidation.minDigits}-${selectedCountryPreset.phoneValidation.maxDigits} dígitos`}
                    {" · "}
                    Ej.{" "}
                    {selectedCountryPreset.phoneValidation.internationalExample}
                  </div>

                  <div className="md:col-span-2">
                    <span className="font-semibold text-slate-700">
                      Regla fiscal:
                    </span>{" "}
                    {selectedCountryPreset.regionalTaxRules.description}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Estos valores son una guía regional. La moneda principal, zona
                horaria, impuesto, niveles administrativos, identificación y
                reglas fiscales pueden ajustarse o validarse según la operación
                real de cada negocio.
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nivel administrativo 1
              </span>
              <input
                value={form.admin_level_1_label}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    admin_level_1_label: event.target.value,
                  }))
                }
                placeholder={selectedCountryPreset.adminLevel1Label}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 placeholder:italic focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nivel administrativo 2
              </span>
              <input
                value={form.admin_level_2_label}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    admin_level_2_label: event.target.value,
                  }))
                }
                placeholder={selectedCountryPreset.adminLevel2Label}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 placeholder:italic focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nivel administrativo 3
              </span>
              <input
                value={form.admin_level_3_label || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    admin_level_3_label: event.target.value,
                  }))
                }
                placeholder={selectedCountryPreset.adminLevel3Label ?? ""}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 placeholder:italic focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Zona horaria
              </span>
              <select
                value={form.timezone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                {timezoneOptions.map((timezoneOption) => (
                  <option
                    key={timezoneOption.value}
                    value={timezoneOption.value}
                  >
                    {timezoneOption.label} - {timezoneOption.value}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Si el país tiene más de una zona horaria, seleccione la que
                corresponde a la operación principal.
              </p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Moneda principal
              </span>
              <select
                value={form.default_currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    default_currency: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency} - {currencyNames[currency] || "Moneda"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Se autocompleta según el país, pero puede cambiarse si la
                empresa opera con otra moneda.
              </p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Impuesto por defecto (%)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form.default_tax_rate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    default_tax_rate: Number(event.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
              <p className="text-xs text-slate-400">
                Es una tasa sugerida. Puede ajustarse según la operación,
                provincia, estado o régimen fiscal aplicable.
              </p>
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Automatización de mantenimiento
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Configure cómo y cuándo el sistema debe contactar clientes por
            mantenimientos próximos.
          </p>

          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  WhatsApp activo
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Permite que el sistema utilice WhatsApp para comunicaciones.
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.whatsapp_enabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    whatsapp_enabled: event.target.checked,
                  }))
                }
                className="h-5 w-5 rounded border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Contacto automático
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Activa el envío automático de mensajes para mantenimientos.
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.auto_contact_enabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    auto_contact_enabled: event.target.checked,
                  }))
                }
                className="h-5 w-5 rounded border-slate-300"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Días antes para contactar
                </span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.maintenance_contact_days_before}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maintenance_contact_days_before: Number(
                        event.target.value,
                      ),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
                <p className="text-xs text-slate-400">
                  Este valor aplica de forma general para los clientes que
                  permiten contacto por WhatsApp.
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Hora automática de envío
                </span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={form.automatic_send_hour}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      automatic_send_hour: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
                <p className="text-xs text-slate-400">
                  Use formato 24 horas. Ejemplo: 9 = 9:00 a. m.
                </p>
              </label>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
              Estos valores funcionarán como configuración general para la
              automatización de mantenimientos. Cada cliente seguirá controlando
              únicamente si permite o no el contacto por WhatsApp.
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {futureSections.map((section) => (
          <article
            key={section.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-slate-900">
              {section.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {section.description}
            </p>

            <div className="mt-5 space-y-2">
              {section.items.map((item) => {
                const isCalendarBlockedItem =
                  section.title === "Operación y agenda" &&
                  item === "Bloqueos de calendario";
                const isActive = activeOperationSection === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (!isCalendarBlockedItem) return;

                      setActiveOperationSection((current) =>
                        current === item ? null : item,
                      );
                    }}
                    disabled={!isCalendarBlockedItem}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      isCalendarBlockedItem
                        ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                        : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-75"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {item}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isCalendarBlockedItem
                          ? isActive
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {isCalendarBlockedItem
                        ? isActive
                          ? "Abierto"
                          : "Gestionar"
                        : "Próximamente"}
                    </span>
                  </button>
                );
              })}
            </div>

            {section.title === "Operación y agenda" &&
            activeOperationSection === "Bloqueos de calendario" ? (
              <CalendarBlockedDatesManager />
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
