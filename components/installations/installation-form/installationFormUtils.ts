import { isCostaRicaCountry } from "@/lib/config/country-features";
import { getCountryPreset } from "@/lib/settings/countryPresets";
import {
  fallbackCountryPreset,
  type CountryPreset,
  type TechnicianOption,
} from "./installationFormConfig";

export function getBusinessCountryPreset(
  countryCode?: string | null,
): CountryPreset {
  return getCountryPreset(countryCode) ?? fallbackCountryPreset;
}

export function isCostaRicaPreset(countryPreset: CountryPreset) {
  return isCostaRicaCountry(countryPreset.countryCode);
}

export function formatTechnicianName(technician: TechnicianOption) {
  return [technician.first_name, technician.last_name_1, technician.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export function formatRole(role?: string | null) {
  if (!role) return "-";

  if (role === "TECHNICIAN") return "Técnico";
  if (role === "SUPERVISOR") return "Supervisor";
  if (role === "ADMINISTRATION") return "Administración";
  if (role === "ADMIN") return "Admin";

  return role;
}
