"use client";

type MiniInfoCardProps = {
  label: string;
  value: string;
};

export function MiniInfoCard({ label, value }: MiniInfoCardProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}
