"use client";

import { useState } from "react";

type FollowUpCollapsibleSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function FollowUpCollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: FollowUpCollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
      >
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h2>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {isOpen ? "Ocultar" : "Mostrar"}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 md:px-6 md:pb-6">
          {children}
        </div>
      )}
    </section>
  );
}
