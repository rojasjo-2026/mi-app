type InfoRowProps = {
  label: string;
  value: string;
};

export default function InfoRow({ label, value }: InfoRowProps) {
  const isEmpty = !value || value === "-";

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
