import Card from "./Card";
import { formatDate } from "@/lib/installations/installation-detail.utils";
import {
  getFollowUpAccentClass,
  getFollowUpStateLabel,
  getScheduleBadge,
} from "@/lib/installations/follow-up-ui.utils";
import type { InstallationDetail } from "@/lib/installations/installation-detail.types";

type InstallationFollowUpsSectionProps = {
  followUps?: InstallationDetail["follow_ups"];
  isInactive?: boolean;
  completingFollowUpId: string | null;
  onComplete: (followUpId: string) => void;
};

export default function InstallationFollowUpsSection({
  followUps,
  isInactive = false,
  completingFollowUpId,
  onComplete,
}: InstallationFollowUpsSectionProps) {
  return (
    <section>
      <Card title="Mantenimientos de esta instalación">
        {followUps && followUps.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {followUps.map((followUp) => {
              const isCompleted =
                followUp.follow_up_status?.code === "completed";

              const isCompleting =
                completingFollowUpId === followUp.follow_up_id;

              return (
                <article
                  key={followUp.follow_up_id}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${getFollowUpAccentClass(
                            followUp,
                          )}`}
                          aria-hidden="true"
                        />

                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {getFollowUpStateLabel(followUp)}
                        </span>

                        {getScheduleBadge(followUp)}
                      </div>

                      <h3 className="mt-3 text-sm font-semibold tracking-tight text-slate-950">
                        {followUp.reason || "Mantenimiento programado"}
                      </h3>

                      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Estado
                          </p>

                          <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
                            {followUp.follow_up_status?.name ||
                              followUp.follow_up_status?.code ||
                              "-"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Prioridad
                          </p>

                          <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
                            {String(followUp.priority ?? "-")}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Fecha objetivo
                          </p>

                          <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
                            {formatDate(followUp.target_date)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Fecha límite
                          </p>

                          <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
                            {formatDate(followUp.due_date)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Notas
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {followUp.notes || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3 lg:w-48 lg:flex-col">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/follow-ups/${followUp.follow_up_id}`;
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Ver mantenimiento
                      </button>

                      {!isInactive && !isCompleted ? (
                        <button
                          type="button"
                          onClick={() => onComplete(followUp.follow_up_id)}
                          disabled={isCompleting}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCompleting ? "Completando..." : "Completar"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hay mantenimientos asociados a esta instalación.
          </div>
        )}
      </Card>
    </section>
  );
}
