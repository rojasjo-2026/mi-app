import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export default function FormSection({
  title,
  isOpen,
  onToggle,
  children,
}: FormSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-slate-50"
      >
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          {isOpen ? "Ocultar" : "Mostrar"}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 p-6">{children}</div>
      )}
    </section>
  );
}
