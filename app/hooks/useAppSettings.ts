"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_COUNTRY_CODE,
  getBusinessCountryMeta,
  type AppSettingsData,
  type AppSettingsResponse,
} from "@/lib/settings/appSettingsUtils";

type UseAppSettingsResult = {
  settings: AppSettingsData | null;
  businessCountryMeta: ReturnType<typeof getBusinessCountryMeta>;
  countryCode: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  phoneCountryCode: string;
  isLoadingSettings: boolean;
  settingsError: string;
  refreshSettings: () => Promise<void>;
};

export function useAppSettings(): UseAppSettingsResult {
  const [settings, setSettings] = useState<AppSettingsData | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState("");

  async function loadSettings() {
    try {
      setIsLoadingSettings(true);
      setSettingsError("");

      const response = await fetch("/api/settings", {
        cache: "no-store",
      });

      const result: AppSettingsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo cargar la configuración.",
        );
      }

      setSettings(result.data ?? null);
    } catch (error) {
      console.error("Error loading app settings:", error);

      setSettings(null);
      setSettingsError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar la configuración.",
      );
    } finally {
      setIsLoadingSettings(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  const businessCountryMeta = useMemo(
    () => getBusinessCountryMeta(settings),
    [settings],
  );

  return {
    settings,
    businessCountryMeta,
    countryCode: businessCountryMeta.countryCode || DEFAULT_COUNTRY_CODE,
    currency: businessCountryMeta.currency,
    timezone: businessCountryMeta.timezone,
    dateFormat: businessCountryMeta.dateFormat,
    phoneCountryCode: businessCountryMeta.phoneCountryCode,
    isLoadingSettings,
    settingsError,
    refreshSettings: loadSettings,
  };
}
