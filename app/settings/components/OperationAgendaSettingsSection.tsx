"use client";

import type { Dispatch, SetStateAction } from "react";

import AgendaRulesManager from "@/app/settings/components/AgendaRulesManager";
import BusinessWorkingHoursManager from "@/app/settings/components/BusinessWorkingHoursManager";
import CalendarBlockedDatesManager from "@/app/settings/components/CalendarBlockedDatesManager";
import CalendarNonWorkingDaysManager from "@/app/settings/components/CalendarNonWorkingDaysManager";
import OperationalAssignmentManager from "@/app/settings/components/OperationalAssignmentManager";

export type SettingsManagementArea = "operations" | "access";

type OperationAgendaSettingsSectionProps = {
  area: SettingsManagementArea;
  activeOperationSection: string | null;
  onActiveOperationSectionChange: Dispatch<SetStateAction<string | null>>;
  countryCode: string;
  countryName: string;
};

const operationItems = [
  {
    title: "Horario laboral",
    description: "Horas y días habituales de operación.",
  },
  {
    title: "Días no laborables",
    description: "Feriados, cierres especiales y fechas no disponibles.",
  },
  {
    title: "Reglas de agenda",
    description: "Capacidad diaria y condiciones para ofrecer una fecha.",
  },
  {
    title: "Bloqueos de calendario",
    description: "Fechas bloqueadas manualmente para nuevas visitas.",
  },
  {
    title: "Asignación operativa",
    description: "Zonas, rutas y fechas planificadas por región.",
  },
];

const accessItems = [
  "Usuarios activos",
  "Roles",
  "Permisos",
  "Accesos administrativos",
];

export default function OperationAgendaSettingsSection({
  area,
  activeOperationSection,
  onActiveOperationSectionChange,
  countryCode,
  countryName,
}: OperationAgendaSettingsSectionProps) {
  if (area === "access") {
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          Accesos y permisos
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Administre usuarios, roles y permisos relacionados con el uso del
          sistema.
        </p>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
          La administración avanzada de usuarios, roles y permisos estará
          disponible en una próxima fase.
        </div>

        <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
          {accessItems.map((item) => (
            <div
              key={item}
              className="flex cursor-default items-center justify-between gap-4 bg-slate-50 px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-600">
                {item}
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                Próximamente
              </span>
            </div>
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        Operación y agenda
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        Controle horarios laborales, días no disponibles y reglas operativas
        del calendario.
      </p>

      <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
        {operationItems.map((item) => {
          const isActive = activeOperationSection === item.title;

          return (
            <button
              key={item.title}
              type="button"
              onClick={() =>
                onActiveOperationSectionChange((current) =>
                  current === item.title ? null : item.title,
                )
              }
              className={[
                "flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition",
                isActive
                  ? "bg-blue-50"
                  : "bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">
                  {item.title}
                </span>

                <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                  {item.description}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-3">
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  {isActive
                    ? "Abierto"
                    : item.title === "Horario laboral"
                      ? "Activo"
                      : "Configurar"}
                </span>

                <span
                  aria-hidden="true"
                  className={[
                    "text-lg leading-none text-slate-400 transition",
                    isActive ? "rotate-90" : "",
                  ].join(" ")}
                >
                  ›
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {activeOperationSection === "Horario laboral" ? (
        <BusinessWorkingHoursManager
          countryCode={countryCode}
          countryName={countryName}
        />
      ) : null}

      {activeOperationSection === "Días no laborables" ? (
        <CalendarNonWorkingDaysManager />
      ) : null}

      {activeOperationSection === "Reglas de agenda" ? (
        <AgendaRulesManager
          countryCode={countryCode}
          countryName={countryName}
        />
      ) : null}

      {activeOperationSection === "Bloqueos de calendario" ? (
        <CalendarBlockedDatesManager />
      ) : null}

      {activeOperationSection === "Asignación operativa" ? (
        <OperationalAssignmentManager
          countryCode={countryCode}
          countryName={countryName}
        />
      ) : null}
    </article>
  );
}
