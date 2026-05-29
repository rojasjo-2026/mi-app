"use client";

type ClientFormSectionHeaderProps = {
  icon: string;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
};

export default function ClientFormSectionHeader({
  icon,
  title,
  description,
  isOpen,
  onToggle,
}: ClientFormSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        {isOpen ? "Ocultar" : "Mostrar"}
        <span className="ml-2 text-slate-400">{isOpen ? "⌃" : "⌄"}</span>
      </button>
    </div>
  );
}
