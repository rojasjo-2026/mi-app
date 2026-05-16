import type { InstallationChangeLogItem } from "@/lib/installations/installation-detail.types";
import Card from "./Card";
import {
  formatChangeLogDate,
  formatChangeLogFieldLabel,
  formatChangeLogValue,
} from "../utils/installationDetailFormatters";

type InstallationChangeLogSectionProps = {
  changeLogs: InstallationChangeLogItem[];
};

function normalizeChangeLogDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function normalizeChangeLogFieldName(value: string | null | undefined) {
  return value?.trim() || "unknown";
}

export default function InstallationChangeLogSection({
  changeLogs,
}: InstallationChangeLogSectionProps) {
  return (
    <section>
      <Card title="🕘 Historial de cambios">
        {changeLogs.length > 0 ? (
          <div className="space-y-3">
            {changeLogs.map((log, index) => {
              const fieldName = normalizeChangeLogFieldName(log.field_name);

              return (
                <div
                  key={log.change_log_id ?? `${fieldName}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatChangeLogFieldLabel(fieldName)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                        <span className="rounded-lg bg-red-50 px-2.5 py-1 text-red-700">
                          {formatChangeLogValue(
                            fieldName,
                            log.old_value ?? null,
                          )}
                        </span>

                        <span className="text-slate-400">→</span>

                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">
                          {formatChangeLogValue(
                            fieldName,
                            log.new_value ?? null,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 md:text-right">
                      <p>
                        {formatChangeLogDate(
                          normalizeChangeLogDate(log.changed_at),
                        )}
                      </p>
                      <p>
                        {log.changed_by
                          ? `Por: ${log.changed_by}`
                          : "Por: system"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
            No hay cambios registrados para esta instalación.
          </div>
        )}
      </Card>
    </section>
  );
}
