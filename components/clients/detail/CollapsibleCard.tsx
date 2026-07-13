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
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div
        className={[
          "flex flex-col gap-2.5 px-4 py-3 md:flex-row md:items-center md:justify-between",
          isOpen ? "border-b border-slate-100" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-2.5">
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-slate-950">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
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
            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {isOpen ? "Ocultar" : "Mostrar"}
            <span className="ml-1 text-slate-400">{isOpen ? "⌃" : "⌄"}</span>
          </button>
        </div>
      </div>

      {isOpen && <div className="p-4">{children}</div>}
    </section>
  );
}
