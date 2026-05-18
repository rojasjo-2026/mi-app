import { formatDate } from "@/lib/installations/installation-detail.utils";
import type { ClientNameParts } from "../types/installationDetailPage.types";

export function getClientFullName(client?: ClientNameParts | null): string {
  if (!client) return "";

  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export function getInstallationStatusLabel(status?: string | null): string {
  switch (status) {
    case "OPEN":
      return "Abierta";
    case "IN_PROGRESS":
      return "En proceso";
    case "CLOSED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status || "Sin estado";
  }
}

export function formatChangeLogFieldLabel(fieldName?: string | null): string {
  switch (fieldName) {
    case "client_id":
      return "Cliente";
    case "service_type_id":
      return "Tipo de servicio";
    case "installation_date":
      return "Fecha de instalación";
    case "description":
      return "Descripción";
    case "technical_observations":
      return "Observaciones técnicas";
    case "estimated_amount":
      return "Monto estimado";
    case "warranty_months":
      return "Meses de garantía";
    case "warranty_end_date":
      return "Fin de garantía";
    case "technician_name":
      return "Técnico manual";
    case "technician_id":
      return "Técnico asignado";
    case "installation_status":
      return "Estado";
    case "is_active":
      return "Activación";
    default:
      return fieldName || "Campo";
  }
}

export function formatChangeLogValue(
  fieldName?: string | null,
  value?: string | null,
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (fieldName === "installation_status") {
    return getInstallationStatusLabel(value);
  }

  if (fieldName === "is_active") {
    if (value === "true") return "Activa";
    if (value === "false") return "Inactiva";
  }

  if (fieldName === "installation_date" || fieldName === "warranty_end_date") {
    return formatDate(value);
  }

  return value;
}

export function formatChangeLogDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
