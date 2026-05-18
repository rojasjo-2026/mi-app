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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Instalación origen
          </p>

          <h2 className="text-lg font-semibold text-slate-900">
            Instalación relacionada
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            El mantenimiento nace de esta instalación. Esta relación permite dar
            seguimiento, programar visitas, registrar contacto y mantener la
            trazabilidad operativa.
          </p>
        </div>

        {hasInstallation && onViewInstallation && (
          <button
            type="button"
            onClick={onViewInstallation}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ver instalación
          </button>
        )}
      </div>

      {hasInstallation ? (
        <div className="grid gap-3">
          <InfoCard label="Descripción" value={description} />
          <InfoCard label="Fecha de instalación" value={installationDate} />
          <InfoCard label="Técnico de instalación" value={technician} />
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Este mantenimiento no está ligado a una instalación.
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-700">
            Para mantener una trazabilidad más fuerte, lo ideal es que cada
            mantenimiento esté asociado a una instalación cuando aplique.
          </p>
        </div>
      )}
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-800">{value || "-"}</p>
    </div>
  );
}
