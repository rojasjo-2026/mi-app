import type { ReactNode } from "react";

type FeatureCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function FeatureCard({
  title,
  description,
  children,
}: FeatureCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm md:p-7">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
