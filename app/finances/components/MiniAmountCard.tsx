type MiniAmountCardProps = {
  label: string;
  value: string;
};

export default function MiniAmountCard({ label, value }: MiniAmountCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
