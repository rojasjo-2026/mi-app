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
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-950">
            Cliente
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Datos principales del cliente asociado al mantenimiento.
          </p>
        </div>

        {onViewClient ? (
          <button
            type="button"
            onClick={onViewClient}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Ver cliente
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-200">
        <InfoRow label="Nombre" value={name} />
        <InfoRow label="Teléfono" value={phone} />
        <InfoRow label="Email" value={email} last />
      </div>
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
