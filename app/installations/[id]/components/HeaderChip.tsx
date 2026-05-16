type HeaderChipProps = {
  label: string;
  value: string;
  dark?: boolean;
};

export default function HeaderChip({
  label,
  value,
  dark = false,
}: HeaderChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 ${
        dark
          ? "border border-white/10 bg-white/10"
          : "border border-slate-200 bg-slate-50"
      }`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-wide ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-medium ${
          dark ? "text-white" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
