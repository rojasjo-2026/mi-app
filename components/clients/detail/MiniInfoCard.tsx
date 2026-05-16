"use client";

type MiniInfoCardProps = {
  label: string;
  value: string;
};

export function MiniInfoCard({ label, value }: MiniInfoCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
