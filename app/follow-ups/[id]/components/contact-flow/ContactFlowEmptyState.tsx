"use client";

import type {
  AutomationSettings,
  FollowUpAutomationContext,
} from "./contactFlowTypes";
import { formatDate } from "./contactFlowFormatters";

type AutomationSummary = {
  title: string;
  description: string;
  icon: string;
  badge: string;
  cardClasses: string;
  badgeClasses: string;
  textClasses: string;
};

type ManualFlowAvailability = {
  canStart: boolean;
  reason: string;
};

type ContactFlowEmptyStateProps = {
  settings: AutomationSettings | null;
  followUpContext: FollowUpAutomationContext | null;
  automationSummary: AutomationSummary;
  manualFlowAvailability: ManualFlowAvailability;
  estimatedTriggerDate: string | null;
  actionError: string;
  creatingFlow: boolean;
  onCreateManualFlow: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
};

export default function ContactFlowEmptyState({
  settings,
  followUpContext,
  automationSummary,
  manualFlowAvailability,
  estimatedTriggerDate,
  actionError,
  creatingFlow,
  onCreateManualFlow,
  onRefresh,
}: ContactFlowEmptyStateProps) {
  return (
    <section className="space-y-4">
      <div
        className={`rounded-md border px-3 py-3 ${automationSummary.cardClasses}`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-base shadow-sm">
              {automationSummary.icon}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-sm font-semibold ${automationSummary.textClasses}`}
                >
                  {automationSummary.title}
                </p>

                <span
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${automationSummary.badgeClasses}`}
                >
                  {automationSummary.badge}
                </span>
              </div>

              <p
                className={`mt-1.5 text-xs leading-5 ${automationSummary.textClasses}`}
              >
                {automationSummary.description}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onCreateManualFlow()}
              disabled={!manualFlowAvailability.canStart || creatingFlow}
              className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingFlow ? "Iniciando..." : "Iniciar gestión de contacto"}
            </button>

            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={creatingFlow}
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {actionError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      {!manualFlowAvailability.canStart ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          {manualFlowAvailability.reason}
        </div>
      ) : null}

      <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCell
          label="WhatsApp"
          value={settings?.whatsapp_enabled ? "Activo" : "Inactivo"}
        />

        <InfoCell
          label="Contacto automático"
          value={settings?.auto_contact_enabled ? "Activo" : "Inactivo"}
        />

        <InfoCell
          label="Cliente permite WhatsApp"
          value={
            followUpContext?.client?.whatsapp_opt_in === undefined ||
            followUpContext?.client?.whatsapp_opt_in === null
              ? "Sin validar"
              : followUpContext.client.whatsapp_opt_in
                ? "Sí"
                : "No"
          }
        />

        <InfoCell
          label="Fecha estimada"
          value={formatDate(estimatedTriggerDate)}
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
        <p className="text-sm font-semibold text-slate-800">
          No hay conversación asociada.
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Cuando inicie una gestión automática o manual, aquí se mostrarán el
          estado, las fechas y la conversación completa.
        </p>
      </div>
    </section>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}
