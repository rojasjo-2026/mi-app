import type { CurrencyCode } from "@prisma/client";

export const DEFAULT_APP_SETTINGS = {
  company_name: null,
  company_phone: null,
  company_email: null,

  country_code: "CR",
  country_name: "Costa Rica",

  admin_level_1_label: "Región / Provincia / Estado",
  admin_level_2_label: "Ciudad / Cantón / Municipio",
  admin_level_3_label: "Distrito / Zona",

  timezone: "America/Costa_Rica",
  default_currency: "CRC" as CurrencyCode,
  default_tax_rate: 13,

  whatsapp_enabled: false,
  auto_contact_enabled: true,
  maintenance_contact_days_before: 22,
  automatic_send_hour: 9,
};
