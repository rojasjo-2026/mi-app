"use client";

type ReportCardProps = {
  report: {
    title: string;
    description: string;
    status: string;
    priority: string;
    route: string;
  };
};

function getPriorityClass(priority: string) {
  if (priority === "Alta") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (priority === "Media") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

export default function ReportCard({ report }: ReportCardProps) {
  function handleOpenReport() {
    console.log(`Reporte preparado para futura ruta: ${report.route}`);
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-blue-200 hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            {report.title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {report.description}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getPriorityClass(
            report.priority,
          )}`}
        >
          {report.priority}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-semibold text-slate-500">
          Estado: {report.status}
        </span>

        <button
          type="button"
          onClick={handleOpenReport}
          className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Ver reporte
        </button>
      </div>
    </article>
  );
}
