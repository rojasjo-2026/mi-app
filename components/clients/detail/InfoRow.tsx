"use client";

type InfoRowProps = {
  label: string;
  value: string;
  className?: string;
};

export function InfoRow({ label, value, className = "" }: InfoRowProps) {
  return (
    <div className={`min-w-0 bg-white px-3 py-2.5 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}
