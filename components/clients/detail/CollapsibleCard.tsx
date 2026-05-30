"use client";

import type { ReactNode } from "react";

type CollapsibleCardProps = {
  title: string;
  children: ReactNode;
  rightContent?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  icon?: ReactNode;
  description?: string;
};

export function CollapsibleCard({
  title,
  children,
  rightContent,
  isOpen,
  onToggle,
  icon,
  description,
}: CollapsibleCardProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              {icon}
            </div>
          )}

          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {rightContent}

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            {isOpen ? "Ocultar" : "Mostrar"}
            <span className="ml-1 text-slate-400">{isOpen ? "⌃" : "⌄"}</span>
          </button>
        </div>
      </div>

      {isOpen && <div className="p-5 md:p-6">{children}</div>}
    </section>
  );
}
