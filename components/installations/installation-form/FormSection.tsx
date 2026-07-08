import type { ReactNode } from "react";

export function FormSection({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-slate-200 first:border-t-0">
      <div className="px-4 py-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-950">{title}</h2>

              {badge ? (
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {badge}
                </span>
              ) : null}
            </div>

            <p className="text-xs leading-5 text-slate-500">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
      </div>
    </section>
  );
}
