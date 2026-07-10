import type { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
};

export default function Card({ title, children }: CardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="px-6 pt-5">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      </div>

      <div className="space-y-5 px-6 pb-6 pt-4">{children}</div>
    </section>
  );
}
