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
        className={`rounded-2xl border p-5 ${automationSummary.cardClasses}`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
              {automationSummary.icon}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-sm font-bold ${automationSummary.textClasses}`}
                >
                  {automationSummary.title}
                </p>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${automationSummary.badgeClasses}`}
                >
                  {automationSummary.badge}
                </span>
              </div>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${automationSummary.textClasses}`}
              >
                {automationSummary.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onCreateManualFlow()}
              disabled={!manualFlowAvailability.canStart || creatingFlow}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingFlow ? "Iniciando..." : "Iniciar gestión de contacto"}
            </button>

            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={creatingFlow}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {!manualFlowAvailability.canStart && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {manualFlowAvailability.reason}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            WhatsApp
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {settings?.whatsapp_enabled ? "Activo" : "Inactivo"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Contacto automático
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {settings?.auto_contact_enabled ? "Activo" : "Inactivo"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Cliente permite WhatsApp
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {followUpContext?.client?.whatsapp_opt_in === undefined ||
            followUpContext?.client?.whatsapp_opt_in === null
              ? "Sin validar"
              : followUpContext.client.whatsapp_opt_in
                ? "Sí"
                : "No"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Fecha estimada
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatDate(estimatedTriggerDate)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-800">
          No hay conversación asociada.
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Cuando inicie una gestión de contacto automática o manual, aquí se
          mostrarán el estado, la fecha de activación, los mensajes y la
          conversación completa.
        </p>
      </div>
    </section>
  );
}
