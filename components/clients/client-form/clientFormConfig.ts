import type { ClientStatus } from "@/lib/clients/clientStatus";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
  type CountryPreset,
} from "@/lib/settings/countryPresets";

export type { CountryPreset };

export type ClientType = "PERSON" | "COMPANY" | "OTHER";
export type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

export type ClientFormData = {
  id?: string;
  client_id?: string;

  client_type?: ClientType | null;
  compliance_profile?: ClientComplianceProfile | null;
  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;
  country_code?: string | null;
  identification_country?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;

  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  phone_primary?: string | null;
  phone_secondary?: string | null;
  email?: string | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  client_status?: ClientStatus | string | null;
  whatsapp_opt_in?: boolean | null;
  default_payment_term?: "CASH" | "CREDIT" | null;
  default_credit_days?: number | string | null;
  default_discount_rate?: number | string | null;
  credit_limit?: number | string | null;
  billing_same_as_client?: boolean | null;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  tax_exempt?: boolean | null;
  preferred_currency?: string | null;
};

export type ClientFormProps = {
  mode: "create" | "edit";
  initialData?: ClientFormData | null;
};

export type AppSettingsResponse = {
  success: boolean;
  data: {
    country_code?: string | null;
    default_currency?: string | null;
  } | null;
  message?: string;
};

export type SectionKey = "personal" | "contact" | "location" | "finance" | "billing";

export const DEFAULT_COUNTRY_CODE = "CR";

export const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? Object.values(COUNTRY_PRESETS)[0];

export const currencyNames: Record<string, string> = {
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

export const COSTA_RICA_IDENTIFICATION_OPTIONS = [
  { value: "CEDULA_FISICA", label: "Cédula física" },
  { value: "CEDULA_JURIDICA", label: "Cédula jurídica" },
  { value: "DIMEX", label: "DIMEX" },
  { value: "NITE", label: "NITE" },
  { value: "EXTRANJERO_NO_DOMICILIADO", label: "Extranjero no domiciliado" },
  { value: "NO_CONTRIBUYENTE", label: "No contribuyente" },
  { value: "OTHER", label: "Otro" },
];

export const GLOBAL_IDENTIFICATION_OPTIONS = [
  { value: "NATIONAL_ID", label: "Documento nacional" },
  { value: "TAX_ID", label: "Documento fiscal" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "BUSINESS_REGISTRATION", label: "Registro empresarial" },
  { value: "OTHER", label: "Otro" },
];

