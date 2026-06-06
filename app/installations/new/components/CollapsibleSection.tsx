import type { ReactNode } from "react";

export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
      >
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>

        <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
          {isOpen ? "Ocultar" : "Mostrar"}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-2 md:px-6 md:pb-6">
          {children}
        </div>
      )}
    </section>
  );
}

