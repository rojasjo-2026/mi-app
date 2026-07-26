import type { OperationsWeekZoneDistributionItem } from "./types";

type OperationsWeekZoneDistributionProps = {
  zones: OperationsWeekZoneDistributionItem[];
};

export function OperationsWeekZoneDistribution({
  zones,
}: OperationsWeekZoneDistributionProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-base font-semibold text-slate-950">
          Distribución por zonas
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Zonas operativas del día seleccionado.
        </p>
      </div>

      <div className="max-h-[clamp(260px,38vh,440px)] divide-y divide-slate-200 overflow-y-auto">
        {zones.length === 0 ? (
          <div className="px-4 py-5">
            <p className="text-sm font-semibold text-slate-700">
              No hay zonas con trabajos para el día seleccionado.
            </p>
          </div>
        ) : (
          zones.map((zone) => (
            <div key={zone.zoneKey} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {zone.zoneName}
                  </p>

                  {zone.referenceAddress ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Referencia: {zone.referenceAddress}
                    </p>
                  ) : null}
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {zone.totalJobs} trabajos
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  <p className="text-slate-400">Trabajos</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {zone.totalJobs}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  <p className="text-slate-400">Instalaciones</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {zone.totalInstallations}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  <p className="text-slate-400">Mantenimientos</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {zone.totalMaintenances}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs leading-5 text-slate-500">
          La disponibilidad se calcula para todo el día, no por zona.
        </p>
      </div>
    </section>
  );
}
