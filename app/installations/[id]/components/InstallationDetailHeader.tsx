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

import HeaderChip from "./HeaderChip";

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
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white md:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                Detalle de instalación
              </div>
              {statusBadge}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Vista general de la instalación, cliente asociado, ubicación,
                historial técnico y mantenimientos programados.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <HeaderChip
                label="Cliente"
                value={clientName || "Cliente no definido"}
                dark
              />
              <HeaderChip label="Fecha" value={installationDate} dark />
              <HeaderChip label="Ubicación" value={location} dark />
              <HeaderChip label="Monto" value={amount} dark />
            </div>

            {nextPendingFollowUpDate && (
              <div className="inline-flex rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100">
                Próximo mantenimiento:
                <span className="ml-2 font-semibold">
                  {nextPendingFollowUpDate}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 xl:max-w-md xl:justify-end">
            <button
              type="button"
              onClick={onCreateMaintenance}
              disabled={creatingMaintenance || isInactive}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingMaintenance
                ? "Programando..."
                : "➕ Programar mantenimiento"}
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              ✏️ Editar
            </button>

            {!isInactive && (
              <button
                type="button"
                onClick={onDeactivate}
                disabled={deactivatingInstallation}
                className="rounded-xl border border-red-300/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deactivatingInstallation ? "Desactivando..." : "⛔ Desactivar"}
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
