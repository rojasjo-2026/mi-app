import Card from "./Card";
import MiniInfo from "./MiniInfo";
import { formatDate } from "@/lib/installations/installation-detail.utils";
import {
  getFollowUpAccentClass,
  getFollowUpCardClass,
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
      <Card title="⏱️ Mantenimientos de esta instalación">
        {followUps && followUps.length > 0 ? (
          <div className="space-y-5">
            {followUps.map((followUp, index) => (
              <div key={followUp.follow_up_id} className="relative pl-6">
                {index !== followUps.length - 1 && (
                  <div className="absolute left-[11px] top-10 h-[calc(100%-1rem)] w-px bg-slate-200" />
                )}

                <div
                  className={`absolute left-0 top-7 h-6 w-6 rounded-full border-4 border-white shadow ${getFollowUpAccentClass(
                    followUp,
                  )}`}
                />

                <div className={getFollowUpCardClass(followUp)}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                              {getFollowUpStateLabel(followUp)}
                            </span>
                            {getScheduleBadge(followUp)}
                          </div>

                          <h3 className="text-base font-semibold tracking-tight text-slate-900">
                            {followUp.reason || "Mantenimiento programado"}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <MiniInfo
                          icon="📌"
                          label="Estado"
                          value={
                            followUp.follow_up_status?.name ||
                            followUp.follow_up_status?.code ||
                            "-"
                          }
                        />
                        <MiniInfo
                          icon="🔥"
                          label="Prioridad"
                          value={String(followUp.priority ?? "-")}
                        />
                        <MiniInfo
                          icon="📅"
                          label="Fecha objetivo"
                          value={formatDate(followUp.target_date)}
                        />
                        <MiniInfo
                          icon="⏳"
                          label="Fecha límite"
                          value={formatDate(followUp.due_date)}
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Notas
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {followUp.notes || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:w-auto lg:flex-col">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/follow-ups/${followUp.follow_up_id}`;
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver mantenimiento
                      </button>

                      {!isInactive &&
                        followUp.follow_up_status?.code !== "completed" && (
                          <button
                            type="button"
                            onClick={() => onComplete(followUp.follow_up_id)}
                            disabled={
                              completingFollowUpId === followUp.follow_up_id
                            }
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {completingFollowUpId === followUp.follow_up_id
                              ? "Completando..."
                              : "Completar"}
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
            No hay mantenimientos asociados a esta instalación.
          </div>
        )}
      </Card>
    </section>
  );
}
