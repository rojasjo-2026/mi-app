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
  description: string;
}> = [
  {
    key: "builder",
    label: "Generar reporte",
    description: "Construir reportes con filtros y columnas.",
  },
  {
    key: "import",
    label: "Importar clientes",
    description: "Subir clientes desde Excel.",
  },
  {
    key: "templates",
    label: "Plantillas",
    description: "Reportes guardados para futuras fases.",
  },
];

export default function ReportsTabs({
  mode,
  onModeChange,
  importCount,
}: ReportsTabsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid gap-2 md:grid-cols-3">
        {tabs.map((tab) => {
          const isSelected = mode === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onModeChange(tab.key)}
              className={[
                "rounded-md px-4 py-3 text-left transition",
                isSelected
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{tab.label}</span>

                {tab.key === "import" && importCount > 0 && (
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isSelected
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {importCount}
                  </span>
                )}
              </div>

              <p
                className={[
                  "mt-1 text-xs leading-5",
                  isSelected ? "text-slate-300" : "text-slate-500",
                ].join(" ")}
              >
                {tab.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
