"use client";

import { useEffect, useState } from "react";

type CurrencyCode = "CRC" | "USD";

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

type SettingsApiResponse = {
  success: boolean;
  data: AppSettings | null;
  message?: string;
};

const supportedCountries = [
  {
    code: "CR",
    name: "Costa Rica",
    timezone: "America/Costa_Rica",
    default_currency: "CRC" as CurrencyCode,
    admin_level_1_label: "Región / Provincia / Estado",
    admin_level_2_label: "Ciudad / Cantón / Municipio",
    admin_level_3_label: "Distrito / Zona",
  },
];

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

const defaultForm: Omit<
  AppSettings,
  "settings_id" | "created_at" | "updated_at"
> = {
  company_name: "",
  company_phone: "",
  company_email: "",

  country_code: "CR",
  country_name: "Costa Rica",

  admin_level_1_label: "Región / Provincia / Estado",
  admin_level_2_label: "Ciudad / Cantón / Municipio",
  admin_level_3_label: "Distrito / Zona",

  timezone: "America/Costa_Rica",
  default_currency: "CRC",
  default_tax_rate: 13,

  whatsapp_enabled: false,
  auto_contact_enabled: true,
  maintenance_contact_days_before: 22,
  automatic_send_hour: 9,
};

function normalizeCountryCode(value: string | null | undefined) {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  if (normalizedValue === "COSTA RICA") {
    return "CR";
  }

  const isSupported = supportedCountries.some(
    (country) => country.code === normalizedValue,
  );

  return isSupported ? normalizedValue : "CR";
}

function getCountryByCode(countryCode: string) {
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  return (
    supportedCountries.find(
      (country) => country.code === normalizedCountryCode,
    ) ?? supportedCountries[0]
  );
}

function mapSettingsToForm(settings: AppSettings) {
  const countryCode = normalizeCountryCode(settings.country_code);
  const country = getCountryByCode(countryCode);

  return {
    company_name: settings.company_name || "",
    company_phone: settings.company_phone || "",
    company_email: settings.company_email || "",

    country_code: country.code,
    country_name: country.name,

    admin_level_1_label:
      settings.admin_level_1_label || country.admin_level_1_label,
    admin_level_2_label:
      settings.admin_level_2_label || country.admin_level_2_label,
    admin_level_3_label:
      settings.admin_level_3_label || country.admin_level_3_label,

    timezone: settings.timezone || country.timezone,
    default_currency: settings.default_currency || country.default_currency,
    default_tax_rate: settings.default_tax_rate ?? 13,

    whatsapp_enabled: settings.whatsapp_enabled,
    auto_contact_enabled: settings.auto_contact_enabled,
    maintenance_contact_days_before:
      settings.maintenance_contact_days_before ?? 22,
    automatic_send_hour: settings.automatic_send_hour ?? 9,
  };
}

function buildSettingsPayload(
  form: Omit<AppSettings, "settings_id" | "created_at" | "updated_at">,
) {
  const country = getCountryByCode(form.country_code);

  return {
    ...form,
    country_code: country.code,
    country_name: country.name,
  };
}

export default function SettingsPage() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
            zona horaria.
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
                placeholder="Ej. 8888-8888"
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

                  setForm((current) => ({
                    ...current,
                    country_code: selectedCountry.code,
                    country_name: selectedCountry.name,
                    timezone: selectedCountry.timezone,
                    default_currency: selectedCountry.default_currency,
                    admin_level_1_label: selectedCountry.admin_level_1_label,
                    admin_level_2_label: selectedCountry.admin_level_2_label,
                    admin_level_3_label: selectedCountry.admin_level_3_label,
                  }));
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                {supportedCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.code} - {country.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Se usa para reglas regionales, formatos y futuras
                configuraciones por país.
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Zona horaria
              </span>
              <input
                value={form.timezone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
                placeholder="America/Costa_Rica"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
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
                    default_currency: event.target.value as CurrencyCode,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="CRC">CRC - Colón costarricense</option>
                <option value="USD">USD - Dólar estadounidense</option>
              </select>
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
              {section.items.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {item}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    Próximamente
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
