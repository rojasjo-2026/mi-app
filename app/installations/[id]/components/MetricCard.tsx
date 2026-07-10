type MetricCardProps = {
  label: string;
  value: string;
};

export default function MetricCard({ label, value }: MetricCardProps) {
  const isEmpty = !value || value === "-";

  return (
    <div className="flex h-full min-h-[92px] flex-col justify-between rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-3 truncate text-sm font-semibold ${
          isEmpty ? "text-slate-400" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
