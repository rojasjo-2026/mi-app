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
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-base">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        {isOpen ? "Ocultar" : "Mostrar"}
        <span className="ml-2 text-slate-400">{isOpen ? "⌃" : "⌄"}</span>
      </button>
    </div>
  );
}
