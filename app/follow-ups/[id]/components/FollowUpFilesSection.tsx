"use client";

import EntityFilesSection from "@/components/files/EntityFilesSection";

export default function FollowUpFilesSection({
  followUpId,
}: {
  followUpId: string;
}) {
  return (
    <EntityFilesSection
      entityType="follow_up"
      entityId={followUpId}
      storageFolder="follow-ups"
      eyebrow="Evidencia del mantenimiento"
      title="Archivos del mantenimiento"
      description="Subí fotos, PDFs, comprobantes o documentos relacionados con este mantenimiento para conservar la trazabilidad del trabajo realizado."
      emptyMessage="No hay archivos aún. Agregue evidencias para este mantenimiento."
    />
  );
}
