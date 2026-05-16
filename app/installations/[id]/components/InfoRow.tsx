type InfoRowProps = {
  label: string;
  value: string;
};

export default function InfoRow({ label, value }: InfoRowProps) {
  const isEmpty = !value || value === "-";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-sm leading-6 ${
          isEmpty ? "text-slate-400" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
