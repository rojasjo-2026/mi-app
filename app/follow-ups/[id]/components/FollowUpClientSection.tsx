type FollowUpClientSectionProps = {
  name: string;
  phone: string;
  email: string;
  onViewClient?: () => void;
};

export default function FollowUpClientSection({
  name,
  phone,
  email,
  onViewClient,
}: FollowUpClientSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Cliente principal
          </p>

          <h2 className="text-lg font-semibold text-slate-900">Cliente</h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Este mantenimiento pertenece a este cliente. Toda gestión, contacto,
            archivo, facturación e historial debe mantenerse asociado a este
            contexto.
          </p>
        </div>

        {onViewClient && (
          <button
            type="button"
            onClick={onViewClient}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ver cliente
          </button>
        )}
      </div>

      <div className="grid gap-3">
        <InfoCard label="Nombre" value={name} />
        <InfoCard label="Teléfono" value={phone} />
        <InfoCard label="Email" value={email} />
      </div>
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
