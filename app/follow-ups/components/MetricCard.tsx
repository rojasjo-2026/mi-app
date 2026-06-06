import type { ReactNode } from "react";

export function MetricCard({
  title,
  value,
  detail,
  accentClass,
  bgClass,
}: {
  title: string;
  value: number;
  detail: string;
  accentClass: string;
  bgClass: string;
}) {
  return (
    <article
      className={[
        "rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        bgClass,
      ].join(" ")}
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">
        {title}
      </p>
      <p className={`mt-3 text-3xl font-black ${accentClass}`}>{value}</p>
      <p className="mt-1 text-sm font-medium opacity-80">{detail}</p>
    </article>
  );
}

