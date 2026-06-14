"use client";

type MetricTone = "neutral" | "success" | "warning" | "danger";

type Metric = {
  title: string;
  value: string | number;
  detail: string;
  indicator: string;
  tone: MetricTone | string;
};

type ReportsMetricsProps = {
  metrics: Metric[];
  loading: boolean;
};

function getToneClasses(tone: string) {
  if (tone === "success") {
    return {
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      dot: "bg-emerald-500",
    };
  }

  if (tone === "warning") {
    return {
      badge: "bg-amber-50 text-amber-700 ring-amber-100",
      dot: "bg-amber-500",
    };
  }

  if (tone === "danger") {
    return {
      badge: "bg-red-50 text-red-700 ring-red-100",
      dot: "bg-red-500",
    };
  }

  return {
    badge: "bg-slate-50 text-slate-600 ring-slate-100",
    dot: "bg-blue-500",
  };
}

export default function ReportsMetrics({
  metrics,
  loading,
}: ReportsMetricsProps) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Métricas ejecutivas
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => {
          const toneClasses = getToneClasses(metric.tone);

          return (
            <article
              key={metric.title}
              className="min-h-[132px] rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {metric.title}
                </p>

                <span
                  className={`mt-0.5 h-2 w-2 rounded-full ${toneClasses.dot}`}
                />
              </div>

              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {loading ? "..." : metric.value}
              </p>

              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                {metric.detail}
              </p>

              <span
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${toneClasses.badge}`}
              >
                {metric.indicator}
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
