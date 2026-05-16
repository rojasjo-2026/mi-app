import type { InstallationTechnician } from "./installation-detail.types";

export function getTechnicianDisplayName(
  technician?: InstallationTechnician,
  technicianName?: string | null,
) {
  if (technician) {
    return [
      technician.first_name,
      technician.last_name_1,
      technician.last_name_2,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return technicianName || "Sin asignar";
}

export function formatRole(role?: string | null) {
  if (!role) return "-";

  if (role === "TECHNICIAN") return "Técnico";
  if (role === "SUPERVISOR") return "Supervisor";
  if (role === "ADMINISTRATION") return "Administración";
  if (role === "ADMIN") return "Admin";

  return role;
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-CR");
}
