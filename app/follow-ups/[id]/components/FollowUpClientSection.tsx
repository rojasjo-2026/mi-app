type FollowUpClientSectionProps = {
  name: string;
  phone: string;
  email: string;
};

export default function FollowUpClientSection({
  name,
  phone,
  email,
}: FollowUpClientSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Cliente</h2>
        <p className="mt-1 text-sm text-slate-500">
          Información del cliente asociado a este mantenimiento.
        </p>
      </div>

      <div className="space-y-4">
        <InfoRow label="Nombre" value={name} />
        <InfoRow label="Teléfono" value={phone} />
        <InfoRow label="Email" value={email} />
      </div>
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
