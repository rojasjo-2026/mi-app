type FollowUpInstallationSectionProps = {
  hasInstallation: boolean;
  description: string;
  installationDate: string;
  technician: string;
};

export default function FollowUpInstallationSection({
  hasInstallation,
  description,
  installationDate,
  technician,
}: FollowUpInstallationSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Instalación relacionada
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Datos de la instalación vinculada a este mantenimiento.
        </p>
      </div>

      {hasInstallation ? (
        <div className="space-y-4">
          <InfoRow label="Descripción" value={description} />
          <InfoRow label="Fecha de instalación" value={installationDate} />
          <InfoRow label="Técnico" value={technician} />
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Este mantenimiento no está ligado a una instalación.
        </p>
      )}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}
