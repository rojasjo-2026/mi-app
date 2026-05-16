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

export function formatYesNo(value?: boolean | null) {
  return value ? "Sí" : "No";
}
