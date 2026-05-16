type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-bold text-slate-950">{title}</h2>

      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}
