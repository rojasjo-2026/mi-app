type FinanceSummaryCardProps = {
  label: string;
  value: string;
  helper: string;
};

export default function FinanceSummaryCard({
  label,
  value,
  helper,
}: FinanceSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}
