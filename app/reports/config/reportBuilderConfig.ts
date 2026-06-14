import type { ClientColumnKey, ReportColumn, ReportFilters } from "../types";

export const CLIENT_COLUMNS: ReportColumn[] = [
  {
    key: "client_name",
    label: "Cliente",
    description: "Nombre visible del cliente",
  },
  {
    key: "client_type",
    label: "Tipo",
    description: "Persona, empresa u otro",
  },
  {
    key: "phone_primary",
    label: "Teléfono principal",
    description: "Número principal",
  },
  {
    key: "phone_secondary",
    label: "Teléfono secundario",
    description: "Número alternativo",
  },
  {
    key: "email",
    label: "Email",
    description: "Correo del cliente",
  },
  {
    key: "client_status",
    label: "Estado",
    description: "Estado comercial del cliente",
  },
  {
    key: "whatsapp_opt_in",
    label: "WhatsApp",
    description: "Habilitado para contacto",
  },
  {
    key: "auto_contact_enabled",
    label: "Auto contacto",
    description: "Contacto automático habilitado",
  },
  {
    key: "country_code",
    label: "País",
    description: "Código de país",
  },
  {
    key: "admin_level_1",
    label: "Provincia / Región",
    description: "Primer nivel administrativo",
  },
  {
    key: "admin_level_2",
    label: "Cantón / Ciudad",
    description: "Segundo nivel administrativo",
  },
  {
    key: "admin_level_3",
    label: "Distrito / Zona",
    description: "Tercer nivel administrativo",
  },
  {
    key: "operational_zone",
    label: "Zona operativa real",
    description: "Zona operativa asignada",
  },
  {
    key: "zone",
    label: "Zona",
    description: "Zona operativa o zona textual",
  },
  {
    key: "address_line",
    label: "Dirección",
    description: "Dirección principal",
  },
  {
    key: "tax_id",
    label: "Tax ID",
    description: "Identificación fiscal legacy",
  },
  {
    key: "identification_type",
    label: "Tipo identificación",
    description: "Tipo de identificación",
  },
  {
    key: "identification_number",
    label: "Número identificación",
    description: "Número de identificación",
  },
  {
    key: "default_payment_term",
    label: "Condición de pago",
    description: "Contado o crédito",
  },
  {
    key: "default_credit_days",
    label: "Días crédito",
    description: "Días de crédito configurados",
  },
  {
    key: "preferred_currency",
    label: "Moneda",
    description: "Moneda preferida",
  },
  {
    key: "tax_exempt",
    label: "Exento",
    description: "Exento de impuestos",
  },
  {
    key: "billing_name",
    label: "Nombre facturación",
    description: "Nombre usado para facturación",
  },
  {
    key: "billing_email",
    label: "Email facturación",
    description: "Correo de facturación",
  },
  {
    key: "billing_phone",
    label: "Teléfono facturación",
    description: "Teléfono de facturación",
  },
  {
    key: "billing_address",
    label: "Dirección facturación",
    description: "Dirección de facturación",
  },
  {
    key: "installations_count",
    label: "Instalaciones",
    description: "Cantidad de instalaciones",
  },
  {
    key: "follow_ups_count",
    label: "Mantenimientos",
    description: "Cantidad de follow-ups",
  },
  {
    key: "contact_attempts_count",
    label: "Contactos",
    description: "Intentos de contacto",
  },
  {
    key: "invoices_count",
    label: "Facturas",
    description: "Cantidad de facturas",
  },
  {
    key: "pending_billing",
    label: "Facturación pendiente",
    description: "Saldo abierto",
  },
  {
    key: "created_at",
    label: "Fecha de creación",
    description: "Registro creado",
  },
  {
    key: "updated_at",
    label: "Última actualización",
    description: "Registro actualizado",
  },
];

export const DEFAULT_COLUMNS: ClientColumnKey[] = [
  "client_name",
  "phone_primary",
  "email",
  "client_status",
  "whatsapp_opt_in",
  "admin_level_1",
  "admin_level_2",
  "installations_count",
  "pending_billing",
];

export const initialFilters: ReportFilters = {
  search: "",
  clientType: "all",
  status: "all",
  whatsapp: "all",
  autoContact: "all",
  taxExempt: "all",
  installationStatus: "all",
  pendingBilling: "all",
  countryCode: "all",
  adminLevel1: "all",
  adminLevel2: "all",
  adminLevel3: "all",
  operationalZoneId: "all",
  paymentTerm: "all",
  preferredCurrency: "all",
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
};

export const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export const PDF_MAX_COLUMNS = 8;
export const EXCEL_EXPORT_LIMIT = 1000;
export const PDF_EXPORT_LIMIT = 300;
