import { getCountryPreset } from "@/lib/settings/countryPresets";
import {
  fallbackCountryPreset,
  type ClientComplianceProfile,
  type ClientType,
  type CountryPreset,
} from "./clientFormConfig";

export function getCountryByCode(countryCode?: string | null): CountryPreset {
  return getCountryPreset(countryCode) ?? fallbackCountryPreset;
}

export function getClientTypeLabel(clientType: ClientType) {
  if (clientType === "COMPANY") return "Empresa";
  if (clientType === "OTHER") return "Otro";
  return "Persona física";
}

export function getComplianceProfileLabel(profile: ClientComplianceProfile) {
  return profile === "COSTA_RICA" ? "Costa Rica" : "Global";
}

export function getPaymentTermLabel(paymentTerm: "CASH" | "CREDIT") {
  return paymentTerm === "CREDIT" ? "Crédito" : "Contado";
}

export function getCountryDisplayName(countryCode: string) {
  if (countryCode === "CR") return "Costa Rica";
  return countryCode || "Sin país definido";
}

