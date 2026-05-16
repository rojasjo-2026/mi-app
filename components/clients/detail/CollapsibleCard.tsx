"use client";

import type { ReactNode } from "react";

type CollapsibleCardProps = {
  title: string;
  children: ReactNode;
  rightContent?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
};

export function CollapsibleCard({
  title,
  children,
  rightContent,
  isOpen,
  onToggle,
}: CollapsibleCardProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {rightContent}

          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            {isOpen ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {isOpen && <div className="p-5 md:p-6">{children}</div>}
    </section>
  );
}
