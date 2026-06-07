import type { ReactNode } from "react";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

