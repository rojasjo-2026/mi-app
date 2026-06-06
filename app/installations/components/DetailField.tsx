import type { ReactNode } from "react";

export function DetailField({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  const title =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : label;

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p
        title={label}
        className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-slate-400"
      >
        {label}
      </p>

      <div
        title={title}
        className="mt-1 min-w-0 truncate text-sm font-bold text-slate-800"
      >
        {children ?? value ?? "-"}
      </div>
    </div>
  );
}

