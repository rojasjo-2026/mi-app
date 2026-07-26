import type { CalendarEvent } from "../../types";
import { buildMonthZoneDistribution } from "./operationsMonthUtils";

type OperationsMonthZoneDistributionProps = {
  events: CalendarEvent[];
};

export function OperationsMonthZoneDistribution({
  events,
}: OperationsMonthZoneDistributionProps) {
  const zones = buildMonthZoneDistribution(events);

  return (
    <section className="border-t border-slate-200 px-4 py-4">
      <h3 className="text-sm font-semibold text-slate-950">
        Distribución por zonas
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        La disponibilidad se calcula para todo el día, no por zona.
      </p>

      {zones.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
          No hay distribución por zonas para esta fecha.
        </div>
      ) : (
        <div className="mt-3 max-h-[220px] overflow-y-auto rounded-lg border border-slate-200">
          <div className="grid grid-cols-[minmax(130px,1fr)_70px_86px_96px] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Zona</span>
            <span className="text-center">Trabajos</span>
            <span className="text-center">Inst.</span>
            <span className="text-center">Mant.</span>
          </div>

          <div className="divide-y divide-slate-200">
            {zones.map((zone) => (
              <div
                key={zone.zoneKey}
                className="grid grid-cols-[minmax(130px,1fr)_70px_86px_96px] items-center gap-2 px-3 py-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">
                    {zone.zoneName}
                  </p>

                  {zone.referenceAddress ? (
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {zone.referenceAddress}
                    </p>
                  ) : null}
                </div>

                <span className="text-center font-semibold text-slate-800">
                  {zone.totalJobs}
                </span>

                <span className="text-center font-semibold text-slate-800">
                  {zone.totalInstallations}
                </span>

                <span className="text-center font-semibold text-slate-800">
                  {zone.totalMaintenances}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
