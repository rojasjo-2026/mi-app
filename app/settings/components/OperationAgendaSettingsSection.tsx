"use client";

import type { Dispatch, SetStateAction } from "react";

import AgendaRulesManager from "@/app/settings/components/AgendaRulesManager";
import BusinessWorkingHoursManager from "@/app/settings/components/BusinessWorkingHoursManager";
import CalendarBlockedDatesManager from "@/app/settings/components/CalendarBlockedDatesManager";
import CalendarNonWorkingDaysManager from "@/app/settings/components/CalendarNonWorkingDaysManager";

type OperationAgendaSettingsSectionProps = {
  activeOperationSection: string | null;
  onActiveOperationSectionChange: Dispatch<SetStateAction<string | null>>;
  countryCode: string;
  countryName: string;
};

const futureSections = [
  {
    title: "Operación y agenda",
    description:
      "Controle horarios laborales, días no disponibles y reglas operativas del calendario.",
    items: [
      "Horario laboral",
      "Días no laborables",
      "Reglas de agenda",
      "Bloqueos de calendario",
      "Asignación operativa",
    ],
  },
  {
    title: "Accesos y permisos",
    description:
      "Administre usuarios, roles y permisos relacionados con el uso del sistema.",
    items: ["Usuarios activos", "Roles", "Permisos", "Accesos administrativos"],
  },
];

const manageableOperationItems = [
  "Horario laboral",
  "Días no laborables",
  "Reglas de agenda",
  "Bloqueos de calendario",
];

export default function OperationAgendaSettingsSection({
  activeOperationSection,
  onActiveOperationSectionChange,
  countryCode,
  countryName,
}: OperationAgendaSettingsSectionProps) {
  return (
    <section className="grid gap-5 md:grid-cols-2">
      {futureSections.map((section) => (
        <article
          key={section.title}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {section.description}
          </p>

          <div className="mt-5 space-y-2">
            {section.items.map((item) => {
              const isOperationSection = section.title === "Operación y agenda";
              const isManageableOperationItem =
                isOperationSection && manageableOperationItems.includes(item);
              const isActive = activeOperationSection === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (!isManageableOperationItem) return;

                    onActiveOperationSectionChange((current) =>
                      current === item ? null : item,
                    );
                  }}
                  disabled={!isManageableOperationItem}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    isManageableOperationItem
                      ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                      : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-75"
                  }`}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {item}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isManageableOperationItem
                        ? isActive
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-600"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {isManageableOperationItem
                      ? isActive
                        ? "Abierto"
                        : "Gestionar"
                      : "Próximamente"}
                  </span>
                </button>
              );
            })}
          </div>

          {section.title === "Operación y agenda" &&
          activeOperationSection === "Horario laboral" ? (
            <BusinessWorkingHoursManager
              countryCode={countryCode}
              countryName={countryName}
            />
          ) : null}

          {section.title === "Operación y agenda" &&
          activeOperationSection === "Días no laborables" ? (
            <CalendarNonWorkingDaysManager />
          ) : null}

          {section.title === "Operación y agenda" &&
          activeOperationSection === "Reglas de agenda" ? (
            <AgendaRulesManager
              countryCode={countryCode}
              countryName={countryName}
            />
          ) : null}

          {section.title === "Operación y agenda" &&
          activeOperationSection === "Bloqueos de calendario" ? (
            <CalendarBlockedDatesManager />
          ) : null}
        </article>
      ))}
    </section>
  );
}
