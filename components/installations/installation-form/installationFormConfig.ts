import {
  DEFAULT_COUNTRY_CODE,
  fallbackCountryPreset,
} from "@/lib/config/app-settings";
import type { CountryPreset } from "@/lib/settings/countryPresets";

export type { CountryPreset };

export { DEFAULT_COUNTRY_CODE, fallbackCountryPreset };

export type TechnicianOption = {
  user_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  role?: "TECHNICIAN" | "SUPERVISOR" | "ADMINISTRATION" | "ADMIN" | string;
  is_active?: boolean | null;
};

export type InstallationFormData = {
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

export type InstallationFormProps = {
  mode: "create" | "edit";
  initialData?: InstallationFormData | null;
};

export type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
  } | null;
};
