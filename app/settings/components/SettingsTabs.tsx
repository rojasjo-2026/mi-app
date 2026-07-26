"use client";

export type SettingsTab =
  | "general"
  | "automation"
  | "operations"
  | "access";

type SettingsTabsProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

const tabs: Array<{
  key: SettingsTab;
  label: string;
}> = [
  {
    key: "general",
    label: "General",
  },
  {
    key: "automation",
    label: "Automatización",
  },
  {
    key: "operations",
    label: "Operación y agenda",
  },
  {
    key: "access",
    label: "Accesos y permisos",
  },
];

export default function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div
        role="tablist"
        aria-label="Secciones de configuración"
        className="flex min-w-max items-center gap-7"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className={[
                "cursor-pointer whitespace-nowrap border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition",
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
