"use client";

type SummaryCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function SummaryCard({ label, value, helper }: SummaryCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </section>
  );
}
