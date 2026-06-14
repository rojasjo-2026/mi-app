"use client";

import ReportCard from "./ReportCard";

type CategoryReport = {
  title: string;
  description: string;
  status: string;
  priority: string;
  route: string;
};

type ReportCategorySectionProps = {
  title: string;
  description: string;
  reports: CategoryReport[];
};

export default function ReportCategorySection({
  title,
  description,
  reports,
}: ReportCategorySectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Categoría
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            {title}
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <span className="mt-2 inline-flex w-fit rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-100 sm:mt-0">
          {reports.length} reportes
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {reports.map((report) => (
          <ReportCard key={`${title}-${report.title}`} report={report} />
        ))}
      </div>
    </section>
  );
}
