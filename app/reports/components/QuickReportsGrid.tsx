"use client";

type QuickReport = {
  title: string;
  description: string;
  metric: string | number;
  status: string;
  route: string;
};

type QuickReportsGridProps = {
  reports: QuickReport[];
};

export default function QuickReportsGrid({ reports }: QuickReportsGridProps) {
  function handleOpenReport(route: string) {
    console.log(`Reporte preparado para futura ruta: ${route}`);
  }

  return (
    <section>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Reportes rápidos
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Accesos principales para toma de decisiones
          </h2>
        </div>

        <p className="text-sm font-medium text-slate-500">
          {reports.length} reportes preparados
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <article
            key={report.title}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">
                  {report.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {report.description}
                </p>
              </div>

              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-100">
                {report.status}
              </span>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {report.metric}
            </p>

            <button
              type="button"
              onClick={() => handleOpenReport(report.route)}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver reporte
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
