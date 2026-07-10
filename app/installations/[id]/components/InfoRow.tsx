type InfoRowProps = {
  label: string;
  value: string;
};

export default function InfoRow({ label, value }: InfoRowProps) {
  const isEmpty = !value || value === "-";

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p
        title={!isEmpty ? value : undefined}
        className={`mt-1 break-words text-sm font-semibold leading-6 ${
          isEmpty ? "text-slate-400" : "text-slate-900"
        }`}
      >
        {value || "-"}
      </p>
    </div>
  );
}
