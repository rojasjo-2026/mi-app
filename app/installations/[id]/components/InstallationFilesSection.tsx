"use client";

import EntityFilesSection from "@/components/files/EntityFilesSection";

export default function InstallationFilesSection({
  installationId,
}: {
  installationId: string;
}) {
  return (
    <EntityFilesSection
      entityType="installation"
      entityId={installationId}
      storageFolder="installations"
      eyebrow="Evidencia de la instalación"
      title="Archivos de la instalación"
      description="Subí fotos, PDFs, comprobantes o documentos relacionados con esta instalación para conservar la trazabilidad técnica del trabajo."
      emptyMessage="No hay archivos aún. Agregue evidencias para esta instalación."
    />
  );
}
