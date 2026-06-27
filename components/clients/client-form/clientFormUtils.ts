import { getBusinessCountryPreset } from "@/lib/settings/appSettingsUtils";

import type {
  ClientComplianceProfile,
  ClientType,
  CountryPreset,
} from "./clientFormConfig";

export function getCountryByCode(countryCode?: string | null): CountryPreset {
  return getBusinessCountryPreset(countryCode);
}

export function getCountryDisplayName(countryCode?: string | null) {
  const countryPreset = getCountryByCode(countryCode);

  return countryPreset.countryName;
}

export function getClientTypeLabel(clientType: ClientType) {
  if (clientType === "PERSON") {
    return "Persona física";
  }

  if (clientType === "COMPANY") {
    return "Empresa / Persona jurídica";
  }

  return "Otro";
}

export function getComplianceProfileLabel(
  complianceProfile: ClientComplianceProfile,
) {
  if (complianceProfile === "COSTA_RICA") {
    return "Costa Rica";
  }

  return "Global";
}

export function getPaymentTermLabel(paymentTerm: "CASH" | "CREDIT") {
  if (paymentTerm === "CREDIT") {
    return "Crédito";
  }

  return "Contado";
}
