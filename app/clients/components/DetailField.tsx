import type { ReactNode } from "react";

type DetailFieldProps = {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
};

export function DetailField({ label, value, children }: DetailFieldProps) {
  const displayValue = children ?? value ?? "-";

  const valueTitle =
    typeof displayValue === "string" || typeof displayValue === "number"
      ? String(displayValue)
      : undefined;

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p
        title={label}
        className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
      >
        {label}
      </p>

      <div
        title={valueTitle}
        className="mt-1 min-w-0 truncate text-sm font-semibold text-slate-800"
      >
        {displayValue}
      </div>
    </div>
  );
}
