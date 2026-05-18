import { getClientStatusLabel } from "@/lib/clients/clientStatus";

/* =========================
   Client detail labels
========================= */

export function getClientTypeLabel(type?: string | null) {
  if (type === "PERSON") return "Persona física";
  if (type === "COMPANY") return "Empresa / Persona jurídica";
  if (type === "OTHER") return "Otro";

  return "Persona física";
}

export function getComplianceProfileLabel(profile?: string | null) {
  if (profile === "GLOBAL") return "Global";
  if (profile === "COSTA_RICA") return "Costa Rica";

  return "Costa Rica";
}

export function getIdentificationTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    CEDULA_FISICA: "Cédula física",
    CEDULA_JURIDICA: "Cédula jurídica",
    DIMEX: "DIMEX",
    NITE: "NITE",
    EXTRANJERO_NO_DOMICILIADO: "Extranjero no domiciliado",
    NO_CONTRIBUYENTE: "No contribuyente",
    NATIONAL_ID: "Documento nacional",
    TAX_ID: "Documento fiscal",
    PASSPORT: "Pasaporte",
    BUSINESS_REGISTRATION: "Registro empresarial",
    OTHER: "Otro",
  };

  return type ? (labels[type] ?? type) : "-";
}

export function getPaymentTermLabel(term?: string | null) {
  if (term === "CREDIT") return "Crédito";
  if (term === "CASH") return "Contado";

  return "Contado";
}

/* =========================
   Formatters
========================= */

export function formatYesNo(value?: boolean | null) {
  return value ? "Sí" : "No";
}

export function formatPercentage(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "-";

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return String(value);

  return `${parsed}%`;
}

export function formatOptionalNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "-";

  return String(value);
}

export function formatDateLabel(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTimeLabel(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toSafeNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value?: number | string | null) {
  const amount = toSafeNumber(value);

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* =========================
   Badge classes
========================= */

export function getWhatsAppBadgeClass(enabled?: boolean | null) {
  return enabled
    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border border-slate-200 bg-slate-100 text-slate-700";
}

export function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

/* =========================
   Billing helpers
========================= */

export function getBillingStatusLabel(status?: string | null) {
  if (status === "PENDING") return "Pendiente";
  if (status === "INVOICED") return "Facturado";
  if (status === "PARTIALLY_PAID") return "Parcial";
  if (status === "PAID") return "Pagado";
  if (status === "NOT_BILLABLE") return "No facturable";
  if (status === "BILLING_ERROR") return "Error";
  if (status === "CANCELLED") return "Cancelado";

  return status || "Sin estado";
}

export function getBillingStatusClass(status?: string | null) {
  if (status === "PAID") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "INVOICED" || status === "PARTIALLY_PAID") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "BILLING_ERROR" || status === "CANCELLED") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (status === "NOT_BILLABLE") {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

/* =========================
   Installation helpers
========================= */

export function getInstallationStatusClass(status?: string | null) {
  if (status === "CLOSED") {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  if (status === "IN_PROGRESS") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "CANCELLED") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  return "border border-blue-200 bg-blue-50 text-blue-700";
}

export function getInstallationStatusLabel(status?: string | null) {
  if (status === "OPEN") return "Abierta";
  if (status === "IN_PROGRESS") return "En proceso";
  if (status === "CLOSED") return "Completada";
  if (status === "CANCELLED") return "Cancelada";

  return status || "Sin estado";
}

export function getInstallationActiveBadgeClass(isActive?: boolean | null) {
  return isActive === false
    ? "border border-slate-200 bg-slate-100 text-slate-700"
    : "border border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function getInstallationActiveLabel(isActive?: boolean | null) {
  return isActive === false ? "Inactiva" : "Activa";
}

export function getNextPendingFollowUp<
  T extends {
    target_date: string;
    follow_up_status?: {
      code?: string | null;
    } | null;
  },
>(installation?: { follow_ups?: T[] } | null) {
  if (!installation?.follow_ups?.length) return null;

  const now = new Date();

  return (
    installation.follow_ups.find((item) => {
      if (item.follow_up_status?.code === "completed") return false;

      return new Date(item.target_date).getTime() >= now.getTime();
    }) ?? null
  );
}

/* =========================
   Activity log helpers
========================= */

export function getActivityCategoryLabel(category: string) {
  if (category === "CLIENT") return "Cliente";
  if (category === "INSTALLATION") return "Instalación";
  if (category === "FOLLOW_UP") return "Mantenimiento";
  if (category === "CONTACT") return "Contacto";
  if (category === "FILE") return "Archivo";
  if (category === "FINANCE") return "Finanzas";
  if (category === "SYSTEM") return "Sistema";

  return category;
}

export function getActivityActionLabel(action: string) {
  if (action === "CREATED") return "Creado";
  if (action === "UPDATED") return "Actualizado";
  if (action === "DELETED") return "Eliminado";
  if (action === "STATUS_CHANGED") return "Estado actualizado";
  if (action === "NOTE_ADDED") return "Nota agregada";
  if (action === "FILE_ADDED") return "Archivo agregado";
  if (action === "FILE_REMOVED") return "Archivo removido";
  if (action === "CONTACT_REGISTERED") return "Contacto registrado";
  if (action === "CONTACT_MESSAGE_SENT") return "Mensaje enviado";
  if (action === "INVOICE_CREATED") return "Factura creada";
  if (action === "INVOICE_UPDATED") return "Factura actualizada";
  if (action === "PAYMENT_REGISTERED") return "Pago registrado";
  if (action === "SYSTEM_EVENT") return "Evento del sistema";

  return action;
}

export function getActivityCategoryClass(category: string) {
  if (category === "CLIENT") {
    return "border border-slate-200 bg-slate-50 text-slate-700";
  }

  if (category === "INSTALLATION") {
    return "border border-violet-200 bg-violet-50 text-violet-700";
  }

  if (category === "FOLLOW_UP") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }

  if (category === "CONTACT") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (category === "FILE") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (category === "FINANCE") {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
}

export function getActivityFieldLabel(fieldName?: string | null) {
  if (!fieldName) return "Evento general";

  const labels: Record<string, string> = {
    target_date: "Fecha objetivo",
    due_date: "Fecha límite",
    scheduled_date: "Fecha programada",
    completed_at: "Fecha de finalización",
    reason: "Descripción",
    priority: "Prioridad",
    notes: "Notas",
    maintenance_type: "Tipo de mantenimiento",
    technician_id: "Técnico asignado",
    follow_up_status_id: "Estado",
    estimated_amount: "Monto estimado",
    final_amount: "Monto final",
    cost_amount: "Costo",
    billing_status: "Estado de facturación",
    billing_notes: "Notas de facturación",
    billing_block_reason: "Motivo de bloqueo de facturación",
    description: "Descripción",
    installation_status: "Estado de instalación",
    installation_date: "Fecha de instalación",
    address_line: "Dirección",
    phone_primary: "Teléfono principal",
    phone_secondary: "Teléfono secundario",
    email: "Correo electrónico",
    whatsapp_opt_in: "WhatsApp",
    client_status: "Estado del cliente",
    client_type: "Tipo de cliente",
    compliance_profile: "Perfil de validación",
    display_name: "Nombre visible",
    legal_name: "Nombre legal",
    company_name: "Nombre de empresa",
    commercial_name: "Nombre comercial",
    main_contact_name: "Contacto principal",
    identification_country: "País de identificación",
    identification_type: "Tipo de identificación",
    identification_number: "Número de identificación",
    default_payment_term: "Condición de pago",
    default_credit_days: "Días de crédito",
    default_discount_rate: "Descuento predeterminado",
    credit_limit: "Límite de crédito",
    billing_same_as_client: "Usar datos del cliente para facturación",
    billing_name: "Nombre de facturación",
    billing_email: "Correo de facturación",
    billing_phone: "Teléfono de facturación",
    billing_address: "Dirección de facturación",
    tax_id: "Identificación tributaria",
    tax_exempt: "Exento de IVA",
    preferred_currency: "Moneda preferida",
  };

  return labels[fieldName] ?? fieldName;
}

export function formatActivityValue(
  value?: string | null,
  fieldName?: string | null,
) {
  if (!value) return "—";

  if (fieldName === "client_status") {
    return getClientStatusLabel(value);
  }

  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime()) && value.includes("T")) {
    return formatDateLabel(value);
  }

  return value;
}
