"use client";

import type { ReportMode } from "../types";

type ReportsTabsProps = {
  mode: ReportMode;
  onModeChange: (mode: ReportMode) => void;
};

const tabs: Array<{ key: ReportMode; label: string }> = [
  { key: "builder", label: "Generar reporte" },
  { key: "import", label: "Importar clientes" },
  { key: "templates", label: "Plantillas" },
];

export default function ReportsTabs({ mode, onModeChange }: ReportsTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onModeChange(tab.key)}
          className={[
            "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold transition",
            mode === tab.key
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
