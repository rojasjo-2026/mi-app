import type { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
};

export default function Card({ title, children }: CardProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      </div>

      <div className="space-y-4 px-4 py-4">{children}</div>
    </section>
  );
}
