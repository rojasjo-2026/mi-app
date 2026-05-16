type MiniInfoProps = {
  icon: string;
  label: string;
  value: string;
};

export default function MiniInfo({ icon, label, value }: MiniInfoProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        <span className="text-sm normal-case">{icon}</span>
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
