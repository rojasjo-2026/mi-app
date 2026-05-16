// Utilidad para obtener el nombre completo de un cliente u otra entidad
// Implementación pendiente según necesidades del proyecto

export function getFullName(client?: {
  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
}) {
  if (!client) {
    return "";
  }

  return `${client.first_name ?? ""} ${client.last_name_1 ?? ""} ${client.last_name_2 ?? ""}`
    .replace(/\s+/g, " ")
    .trim();
}
