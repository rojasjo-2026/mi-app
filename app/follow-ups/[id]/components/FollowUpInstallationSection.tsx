type FollowUpInstallationSectionProps = {
  hasInstallation: boolean;
  description: string;
  installationDate: string;
  technician: string;
  onViewInstallation?: () => void;
};

export default function FollowUpInstallationSection({
  hasInstallation,
  description,
  installationDate,
  technician,
  onViewInstallation,
}: FollowUpInstallationSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-950">
            Instalación relacionada
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Instalación de origen y referencia operativa del mantenimiento.
          </p>
        </div>

        {hasInstallation && onViewInstallation ? (
          <button
            type="button"
            onClick={onViewInstallation}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Ver instalación
          </button>
        ) : null}
      </div>

      {hasInstallation ? (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-200">
          <InfoRow label="Descripción" value={description} />
          <InfoRow label="Fecha" value={installationDate} />
          <InfoRow label="Técnico" value={technician} last />
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-sm font-semibold text-amber-800">
            Este mantenimiento no está ligado a una instalación.
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            Asociarlo a una instalación mejora la trazabilidad operativa.
          </p>
        </div>
      )}
    </section>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`grid gap-1 bg-white px-3 py-2.5 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start ${
        last ? "" : "border-b border-slate-200"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="break-words text-sm font-medium leading-5 text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}
