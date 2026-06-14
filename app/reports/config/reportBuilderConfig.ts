import type {
  ClientColumnKey,
  InstallationColumnKey,
  ReportColumn,
  ReportFilters,
  ReportSource,
} from "../types";

export const REPORT_SOURCES: Array<{
  key: ReportSource;
  title: string;
  description: string;
  badge: string;
}> = [
  {
    key: "clients",
    title: "Clientes",
    description:
      "Reporte general de clientes, contacto, ubicación y actividad.",
    badge: "Activo",
  },
  {
    key: "installations",
    title: "Instalaciones",
    description:
      "Reporte operativo de instalaciones, técnicos, estados y facturación.",
    badge: "Activo",
  },
];

export const CLIENT_COLUMNS: ReportColumn[] = [
  {
    key: "client_name",
    label: "Cliente",
    description: "Nombre visible del cliente",
  },
  { key: "client_type", label: "Tipo", description: "Persona, empresa u otro" },
  {
    key: "phone_primary",
    label: "Teléfono principal",
    description: "Contacto principal",
  },
  {
    key: "phone_secondary",
    label: "Teléfono secundario",
    description: "Contacto alternativo",
  },
  { key: "email", label: "Correo", description: "Correo electrónico" },
  {
    key: "client_status",
    label: "Estado",
    description: "Estado comercial del cliente",
  },
  {
    key: "whatsapp_opt_in",
    label: "WhatsApp",
    description: "Cliente acepta WhatsApp",
  },
  {
    key: "auto_contact_enabled",
    label: "Contacto automático",
    description: "Automatización activa",
  },
  { key: "country_code", label: "País", description: "Código de país" },
  {
    key: "admin_level_1",
    label: "Provincia / Región",
    description: "Ubicación nivel 1",
  },
  {
    key: "admin_level_2",
    label: "Cantón / Ciudad",
    description: "Ubicación nivel 2",
  },
  {
    key: "admin_level_3",
    label: "Distrito / Zona",
    description: "Ubicación nivel 3",
  },
  {
    key: "operational_zone",
    label: "Zona operativa",
    description: "Ruta o zona asignada",
  },
  { key: "zone", label: "Zona", description: "Zona del cliente" },
  {
    key: "address_line",
    label: "Dirección",
    description: "Dirección principal",
  },
  { key: "tax_id", label: "Identificación fiscal", description: "ID fiscal" },
  {
    key: "identification_type",
    label: "Tipo de identificación",
    description: "Tipo documental",
  },
  {
    key: "identification_number",
    label: "Número de identificación",
    description: "Número documental",
  },
  {
    key: "default_payment_term",
    label: "Condición de pago",
    description: "Contado o crédito",
  },
  {
    key: "default_credit_days",
    label: "Días de crédito",
    description: "Plazo de crédito",
  },
  {
    key: "preferred_currency",
    label: "Moneda",
    description: "Moneda preferida",
  },
  { key: "tax_exempt", label: "Exento", description: "Exento de impuestos" },
  {
    key: "billing_name",
    label: "Nombre facturación",
    description: "Nombre para facturar",
  },
  {
    key: "billing_email",
    label: "Correo facturación",
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
    description: "Cantidad de seguimientos",
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

export const INSTALLATION_COLUMNS: ReportColumn[] = [
  { key: "client_name", label: "Cliente", description: "Cliente asociado" },
  {
    key: "service_type",
    label: "Tipo de servicio",
    description: "Servicio instalado",
  },
  {
    key: "installation_date",
    label: "Fecha de instalación",
    description: "Fecha del trabajo",
  },
  {
    key: "installation_status",
    label: "Estado instalación",
    description: "Estado operativo",
  },
  {
    key: "is_active",
    label: "Activa",
    description: "Instalación activa o inactiva",
  },
  {
    key: "billing_status",
    label: "Estado facturación",
    description: "Estado financiero",
  },
  {
    key: "estimated_amount",
    label: "Monto estimado",
    description: "Monto estimado",
  },
  { key: "final_amount", label: "Monto final", description: "Monto final" },
  { key: "cost_amount", label: "Costo", description: "Costo interno" },
  {
    key: "pending_billing",
    label: "Facturación pendiente",
    description: "Saldo pendiente",
  },
  {
    key: "warranty_months",
    label: "Garantía meses",
    description: "Meses de garantía",
  },
  {
    key: "warranty_end_date",
    label: "Fin de garantía",
    description: "Fecha fin de garantía",
  },
  { key: "technician_name", label: "Técnico", description: "Técnico asignado" },
  {
    key: "address_line",
    label: "Dirección",
    description: "Dirección de instalación",
  },
  { key: "city", label: "Ciudad", description: "Ciudad" },
  {
    key: "admin_level_1",
    label: "Provincia / Región",
    description: "Ubicación nivel 1",
  },
  {
    key: "admin_level_2",
    label: "Cantón / Ciudad",
    description: "Ubicación nivel 2",
  },
  {
    key: "admin_level_3",
    label: "Distrito / Zona",
    description: "Ubicación nivel 3",
  },
  { key: "zone", label: "Zona", description: "Zona registrada" },
  {
    key: "operational_zone",
    label: "Zona operativa",
    description: "Ruta o zona operativa",
  },
  {
    key: "components_count",
    label: "Componentes",
    description: "Cantidad de componentes",
  },
  {
    key: "follow_ups_count",
    label: "Seguimientos",
    description: "Cantidad de seguimientos",
  },
  {
    key: "pending_follow_up_date",
    label: "Próximo seguimiento",
    description: "Fecha pendiente",
  },
  {
    key: "invoices_count",
    label: "Facturas",
    description: "Cantidad de facturas",
  },
  {
    key: "description",
    label: "Descripción",
    description: "Descripción del trabajo",
  },
  {
    key: "technical_observations",
    label: "Observaciones técnicas",
    description: "Notas técnicas",
  },
  {
    key: "reference_point",
    label: "Punto de referencia",
    description: "Referencia de ubicación",
  },
  {
    key: "location_notes",
    label: "Notas ubicación",
    description: "Notas de ubicación",
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

export const REPORT_COLUMNS_BY_SOURCE = {
  clients: CLIENT_COLUMNS,
  installations: INSTALLATION_COLUMNS,
} satisfies Record<ReportSource, ReportColumn[]>;

export const DEFAULT_COLUMNS_BY_SOURCE = {
  clients: [
    "client_name",
    "phone_primary",
    "email",
    "client_status",
    "whatsapp_opt_in",
    "admin_level_1",
    "admin_level_2",
    "installations_count",
    "pending_billing",
  ] satisfies ClientColumnKey[],

  installations: [
    "client_name",
    "service_type",
    "installation_date",
    "installation_status",
    "billing_status",
    "technician_name",
    "admin_level_1",
    "admin_level_2",
    "pending_billing",
  ] satisfies InstallationColumnKey[],
};

export const initialFilters: ReportFilters = {
  search: "",

  clientType: "all",
  status: "all",
  whatsapp: "all",
  autoContact: "all",
  taxExempt: "all",

  clientId: "all",
  serviceTypeId: "all",
  technicianId: "all",
  installationStatus: "all",
  billingStatus: "all",
  isActive: "all",
  pendingMaintenance: "all",

  pendingBilling: "all",
  countryCode: "all",
  adminLevel1: "all",
  adminLevel2: "all",
  adminLevel3: "all",
  city: "all",
  zone: "all",
  operationalZoneId: "all",

  paymentTerm: "all",
  preferredCurrency: "all",

  minEstimatedAmount: "",
  maxEstimatedAmount: "",

  installationFrom: "",
  installationTo: "",
  warrantyFrom: "",
  warrantyTo: "",
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
};

export const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export const PDF_MAX_COLUMNS = 8;

export const EXCEL_EXPORT_LIMIT = 1000;

export const PDF_EXPORT_LIMIT = 300;
