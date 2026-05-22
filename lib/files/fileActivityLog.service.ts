import { prisma } from "@/lib/prisma";

function isInstallationEntity(entityType?: string | null) {
  return (
    String(entityType || "")
      .trim()
      .toLowerCase() === "installation"
  );
}

export async function recordInstallationFileActivitySafely(params: {
  entityType?: string | null;
  entityId?: string | null;
  fileName?: string | null;
  action: "FILE_ADDED" | "FILE_REMOVED";
}) {
  try {
    const entityId = String(params.entityId || "").trim();
    const fileName = String(params.fileName || "").trim();

    if (!isInstallationEntity(params.entityType) || !entityId || !fileName) {
      return null;
    }

    const installation = await prisma.installation.findUnique({
      where: {
        installation_id: entityId,
      },
      select: {
        installation_id: true,
        client_id: true,
      },
    });

    if (!installation?.client_id) {
      return null;
    }

    const isFileAdded = params.action === "FILE_ADDED";

    return prisma.activityLog.create({
      data: {
        client_id: installation.client_id,
        entity_type: "INSTALLATION",
        entity_id: installation.installation_id,
        category: "FILE",
        action: params.action,
        visibility: "PUBLIC_INTERNAL",
        field_name: "file_name",
        old_value: isFileAdded ? null : fileName,
        new_value: isFileAdded ? fileName : null,
        title: isFileAdded ? "Archivo agregado" : "Archivo removido",
        description: isFileAdded
          ? "Se agregó un archivo a la instalación."
          : "Se eliminó un archivo de la instalación.",
        created_by: "system",
      },
    });
  } catch (error) {
    console.error("Error recording installation file activity:", error);
    return null;
  }
}
