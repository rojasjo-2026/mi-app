import type { ReactNode } from "react";

export function FormSection({
  title,
  description,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-slate-200 first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50"
      >
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

        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900">
          {isOpen ? "Ocultar" : "Mostrar"}
          <span
            aria-hidden="true"
            className={`text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="border-t border-slate-100 px-4 pb-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {children}
          </div>
        </div>
      ) : null}
    </section>
  );
}
