import HeaderChip from "./HeaderChip";

type InstallationDetailHeaderProps = {
  title: string;
  statusBadge: React.ReactNode;
  clientName: string;
  installationDate: string;
  location: string;
  amount: string;
  nextPendingFollowUpDate?: string | null;
  creatingMaintenance: boolean;
  isInactive: boolean;
  deactivatingInstallation: boolean;
  onCreateMaintenance: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  onBack: () => void;
};

export default function InstallationDetailHeader({
  title,
  statusBadge,
  clientName,
  installationDate,
  location,
  amount,
  nextPendingFollowUpDate,
  creatingMaintenance,
  isInactive,
  deactivatingInstallation,
  onCreateMaintenance,
  onEdit,
  onDeactivate,
  onBack,
}: InstallationDetailHeaderProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm">
              Detalle de instalación
            </span>

            {statusBadge}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              Vista general de la instalación, cliente asociado, ubicación,
              historial técnico y mantenimientos programados.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Volver
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={onCreateMaintenance}
            disabled={creatingMaintenance || isInactive}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingMaintenance ? "Programando..." : "Programar mantenimiento"}
          </button>

          {!isInactive ? (
            <button
              type="button"
              onClick={onDeactivate}
              disabled={deactivatingInstallation}
              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deactivatingInstallation ? "Desactivando..." : "Desactivar"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <HeaderChip
          label="Cliente"
          value={clientName || "Cliente no definido"}
        />
        <HeaderChip label="Fecha" value={installationDate} />
        <HeaderChip label="Ubicación" value={location} />
        <HeaderChip label="Monto" value={amount} />
      </div>

      {nextPendingFollowUpDate ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <span className="font-semibold">Próximo mantenimiento:</span>{" "}
          {nextPendingFollowUpDate}
        </div>
      ) : null}
    </section>
  );
}
