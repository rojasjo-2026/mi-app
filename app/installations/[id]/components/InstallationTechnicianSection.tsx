import Card from "./Card";
import InfoGrid from "./InfoGrid";
import InfoRow from "./InfoRow";
import RoleBadge from "./RoleBadge";
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
  const technicianIsMissing = technicianDisplayName === "Sin asignar";

  return (
    <section className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
      <Card title="Técnico y garantía">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Técnico asignado
              </p>

              <p
                title={!technicianIsMissing ? technicianDisplayName : undefined}
                className={`mt-1 break-words text-sm font-semibold leading-6 ${
                  technicianIsMissing ? "text-slate-400" : "text-slate-900"
                }`}
              >
                {technicianDisplayName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {technicianRole ? <RoleBadge role={technicianRole} /> : null}

              {hasLinkedTechnician ? (
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                    technicianIsActive === false
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }`}
                >
                  {technicianIsActive === false ? "Inactivo" : "Asignado"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Garantía</h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Vigencia y cobertura configuradas para esta instalación.
              </p>
            </div>

            <InfoGrid>
              <InfoRow label="Meses de garantía" value={warrantyMonths} />
              <InfoRow label="Fin de garantía" value={warrantyEndDate} />
              <InfoRow label="Cobertura" value={coverage} />
              <InfoRow label="Respaldo manual" value={manualBackup} />
            </InfoGrid>
          </div>
        </div>
      </Card>

      <TechnicalNotes installationId={installationId} />
    </section>
  );
}
