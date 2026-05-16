import Card from "./Card";
import InfoGrid from "./InfoGrid";
import InfoRow from "./InfoRow";
import RoleBadge from "./RoleBadge";
import FeatureCard from "./FeatureCard";
import TechnicalNotes from "./TechnicalNotes";

type InstallationTechnicianSectionProps = {
  installationId: string;
  technicianDisplayName: string;
  technicianRole?: string | null;
  technicianIsActive?: boolean | null;
  hasLinkedTechnician: boolean;
  warrantyMonths: string;
  warrantyEndDate: string;
  coverage: string;
  manualBackup: string;
};

export default function InstallationTechnicianSection({
  installationId,
  technicianDisplayName,
  technicianRole,
  technicianIsActive,
  hasLinkedTechnician,
  warrantyMonths,
  warrantyEndDate,
  coverage,
  manualBackup,
}: InstallationTechnicianSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card title="🛠️ Técnico y garantía">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Técnico asignado
                </p>
                <p
                  className={`mt-1 text-sm leading-6 ${
                    technicianDisplayName === "Sin asignar"
                      ? "text-slate-400"
                      : "text-slate-800"
                  }`}
                >
                  {technicianDisplayName}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {technicianRole && <RoleBadge role={technicianRole} />}

                {hasLinkedTechnician && (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      technicianIsActive === false
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {technicianIsActive === false ? "Inactivo" : "Asignado"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <InfoGrid>
            <InfoRow label="Meses de garantía" value={warrantyMonths} />
            <InfoRow label="Fin de garantía" value={warrantyEndDate} />
            <InfoRow label="Cobertura" value={coverage} />
            <InfoRow label="Respaldo manual" value={manualBackup} />
          </InfoGrid>
        </div>
      </Card>

      <FeatureCard
        title="📝 Observaciones técnicas"
        description="Registra hallazgos, cambios y notas operativas para mantener un historial claro de la instalación."
      >
        <TechnicalNotes installationId={installationId} />
      </FeatureCard>
    </section>
  );
}
