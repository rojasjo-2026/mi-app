"use client";

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
  const summaryItems = [
    {
      label: "Cliente",
      value: clientName || "Cliente no definido",
    },
    {
      label: "Fecha de instalación",
      value: installationDate || "-",
    },
    {
      label: "Ubicación",
      value: location || "-",
    },
    {
      label: "Monto estimado",
      value: amount || "-",
    },
    ...(nextPendingFollowUpDate
      ? [
          {
            label: "Próximo mantenimiento",
            value: nextPendingFollowUpDate,
          },
        ]
      : []),
  ];

  const summaryGridClass =
    summaryItems.length === 5
      ? "grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-5"
      : "grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-blue-600 shadow-sm">
              Detalle de instalación
            </div>

            {statusBadge}
          </div>

          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-slate-950">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Vista general de la instalación, cliente asociado, ubicación,
            historial técnico y mantenimientos programados.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3 xl:max-w-[620px] xl:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Volver
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={onCreateMaintenance}
            disabled={creatingMaintenance || isInactive}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingMaintenance ? "Programando..." : "Programar mantenimiento"}
          </button>

          {!isInactive ? (
            <button
              type="button"
              onClick={onDeactivate}
              disabled={deactivatingInstallation}
              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deactivatingInstallation ? "Desactivando..." : "Desactivar"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className={summaryGridClass}>
          {summaryItems.map((item, index) => {
            const isMaintenance = item.label === "Próximo mantenimiento";

            return (
              <div
                key={item.label}
                className={`min-w-0 ${
                  index > 0 ? "xl:border-l xl:border-slate-200 xl:pl-6" : ""
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {item.label}
                </p>

                <p
                  title={item.value}
                  className={`mt-1 break-words text-sm font-semibold leading-6 ${
                    isMaintenance ? "text-emerald-700" : "text-slate-950"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
