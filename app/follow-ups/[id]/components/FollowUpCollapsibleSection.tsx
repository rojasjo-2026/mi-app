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
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50",
          isOpen ? "border-b border-slate-100" : "",
        ].join(" ")}
      >
        <h2 className="text-sm font-semibold tracking-tight text-slate-950">
          {title}
        </h2>

        <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-sm">
          {isOpen ? "Ocultar" : "Mostrar"}
        </span>
      </button>

      {isOpen ? <div className="p-4">{children}</div> : null}
    </section>
  );
}
