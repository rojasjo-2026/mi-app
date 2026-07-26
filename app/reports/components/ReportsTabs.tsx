"use client";

import type { ReportMode } from "../types";

type ReportsTabsProps = {
  mode: ReportMode;
  onModeChange: (mode: ReportMode) => void;
  importCount: number;
};

const tabs: Array<{
  key: ReportMode;
  label: string;
}> = [
  {
    key: "builder",
    label: "Generar reporte",
  },
  {
    key: "import",
    label: "Importar clientes",
  },
  {
    key: "templates",
    label: "Plantillas",
  },
];

export default function ReportsTabs({
  mode,
  onModeChange,
  importCount,
}: ReportsTabsProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div
        role="tablist"
        aria-label="Opciones del centro de reportes"
        className="flex min-w-max items-center px-2"
      >
        {tabs.map((tab) => {
          const isSelected = mode === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onModeChange(tab.key)}
              className={[
                "relative inline-flex h-12 min-w-[180px] items-center justify-center gap-2 border-b-2 px-5 text-sm font-semibold transition",
                isSelected
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
              ].join(" ")}
            >
              <span>{tab.label}</span>

              {tab.key === "import" && importCount > 0 && (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    isSelected
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  {importCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
