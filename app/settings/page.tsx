"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COUNTRY_PRESET_OPTIONS,
  COUNTRY_PRESETS,
  getCountryPreset,
  type CountryPreset,
  type CountryTimezoneOption,
} from "@/lib/settings/countryPresets";

import GeneralSettingsSection from "@/app/settings/components/GeneralSettingsSection";
import MaintenanceAutomationSettingsSection from "@/app/settings/components/MaintenanceAutomationSettingsSection";
import OperationAgendaSettingsSection from "@/app/settings/components/OperationAgendaSettingsSection";
import SettingsHeader from "@/app/settings/components/SettingsHeader";

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
  >("Horario laboral");

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

  function handleCountryChange(countryCode: string) {
    const selectedCountry = getCountryByCode(countryCode);

    setForm((current) => applyCountryPresetToForm(current, selectedCountry));

    setCountryPresetMessage(
      `Se aplicaron valores sugeridos para ${selectedCountry.countryName}. Puede ajustar moneda, impuesto, zona horaria y niveles administrativos antes de guardar.`,
    );
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
      <SettingsHeader
        settingsId={settingsId}
        saving={saving}
        error={error}
        successMessage={successMessage}
        onSave={() => void handleSave()}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <GeneralSettingsSection
          form={form}
          selectedCountryPreset={selectedCountryPreset}
          timezoneOptions={timezoneOptions}
          countryPresetMessage={countryPresetMessage}
          countryOptions={COUNTRY_PRESET_OPTIONS}
          currencyOptions={currencyOptions}
          currencyNames={currencyNames}
          taxModeLabels={taxModeLabels}
          onFormChange={setForm}
          onCountryChange={handleCountryChange}
        />

        <MaintenanceAutomationSettingsSection
          form={form}
          onFormChange={setForm}
        />
      </section>

      <OperationAgendaSettingsSection
        activeOperationSection={activeOperationSection}
        onActiveOperationSectionChange={setActiveOperationSection}
        countryCode={form.country_code}
        countryName={form.country_name}
      />
    </div>
  );
}
