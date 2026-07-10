"use client";

import { useEffect, useMemo, useState } from "react";
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

type GroupedChangeLogItem = {
  log: InstallationChangeLogItem;
  fieldName: string;
};

type ChangeLogGroup = {
  key: string;
  changedAt: string | null;
  changedBy: string;
  firstIndex: number;
  items: GroupedChangeLogItem[];
};

const GROUPS_PER_PAGE = 6;

function normalizeChangeLogDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  return value;
}

function normalizeChangeLogFieldName(value: string | null | undefined) {
  return value?.trim() || "unknown";
}

function getTimestamp(value: string | null) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function buildChangeLogGroups(
  changeLogs: InstallationChangeLogItem[],
): ChangeLogGroup[] {
  const groups = new Map<string, ChangeLogGroup>();

  changeLogs.forEach((log, index) => {
    const changedAt = normalizeChangeLogDate(log.changed_at);
    const changedBy = log.changed_by?.trim() || "system";
    const fieldName = normalizeChangeLogFieldName(log.field_name);

    // Solo agrupamos cambios que comparten exactamente fecha y usuario.
    // Cuando falta la fecha, cada cambio conserva su propio grupo.
    const key = changedAt
      ? `${changedAt}::${changedBy}`
      : `without-date::${changedBy}::${index}`;

    const currentGroup = groups.get(key);

    if (currentGroup) {
      currentGroup.items.push({ log, fieldName });
      return;
    }

    groups.set(key, {
      key,
      changedAt,
      changedBy,
      firstIndex: index,
      items: [{ log, fieldName }],
    });
  });

  return Array.from(groups.values()).sort((groupA, groupB) => {
    const timestampA = getTimestamp(groupA.changedAt);
    const timestampB = getTimestamp(groupB.changedAt);

    if (timestampA !== null && timestampB !== null) {
      return timestampB - timestampA;
    }

    if (timestampA !== null) return -1;
    if (timestampB !== null) return 1;

    return groupA.firstIndex - groupB.firstIndex;
  });
}

function getGroupTitle(group: ChangeLogGroup) {
  if (group.items.length === 1) {
    return formatChangeLogFieldLabel(group.items[0].fieldName);
  }

  return "Actualización de la instalación";
}

export default function InstallationChangeLogSection({
  changeLogs,
}: InstallationChangeLogSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const groupedChangeLogs = useMemo(
    () => buildChangeLogGroups(changeLogs),
    [changeLogs],
  );

  const latestGroup = groupedChangeLogs[0] ?? null;
  const totalPages = Math.max(
    1,
    Math.ceil(groupedChangeLogs.length / GROUPS_PER_PAGE),
  );

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * GROUPS_PER_PAGE;

    return groupedChangeLogs.slice(startIndex, startIndex + GROUPS_PER_PAGE);
  }, [currentPage, groupedChangeLogs]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function openHistory() {
    setCurrentPage(1);
    setIsOpen(true);
  }

  function closeHistory() {
    setIsOpen(false);
  }

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  }

  return (
    <>
      <section>
        <Card title="Historial de cambios">
          {latestGroup ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {changeLogs.length === 1
                      ? "1 cambio registrado"
                      : `${changeLogs.length} cambios registrados`}
                  </span>

                  {groupedChangeLogs.length !== changeLogs.length ? (
                    <span className="text-xs text-slate-500">
                      Agrupados en {groupedChangeLogs.length} actualizaciones
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-950">
                  Último cambio: {getGroupTitle(latestGroup)}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {formatChangeLogDate(latestGroup.changedAt)} · Por:{" "}
                  {latestGroup.changedBy}
                </p>
              </div>

              <button
                type="button"
                onClick={openHistory}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Ver historial completo
              </button>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No hay cambios registrados para esta instalación.
            </div>
          )}
        </Card>
      </section>

      {isOpen && latestGroup ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          onMouseDown={closeHistory}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="installation-change-log-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2
                  id="installation-change-log-title"
                  className="text-lg font-semibold text-slate-950"
                >
                  Historial de cambios
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Auditoría de los valores modificados en esta instalación.
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {changeLogs.length === 1
                    ? "1 cambio registrado"
                    : `${changeLogs.length} cambios registrados`}{" "}
                  {" · "}
                  {groupedChangeLogs.length === 1
                    ? "1 actualización"
                    : `${groupedChangeLogs.length} actualizaciones`}
                </p>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="divide-y divide-slate-200">
                {paginatedGroups.map((group) => (
                  <article
                    key={group.key}
                    className="py-6 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-950">
                          {getGroupTitle(group)}
                        </h3>

                        {group.items.length > 1 ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {group.items.length} campos modificados en una misma
                            actualización.
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-xs leading-5 text-slate-500 lg:text-right">
                        <p>{formatChangeLogDate(group.changedAt)}</p>
                        <p>Por: {group.changedBy}</p>
                      </div>
                    </div>

                    <div className="mt-5 divide-y divide-slate-100">
                      {group.items.map(({ log, fieldName }, itemIndex) => (
                        <div
                          key={
                            log.change_log_id ??
                            `${group.key}-${fieldName}-${itemIndex}`
                          }
                          className="py-5 first:pt-0 last:pb-0"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {formatChangeLogFieldLabel(fieldName)}
                          </p>

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                Valor anterior
                              </p>

                              <div className="mt-1 rounded-md border border-red-100 bg-red-50 px-3 py-2">
                                <p className="break-words text-sm font-medium leading-6 text-red-700">
                                  {formatChangeLogValue(
                                    fieldName,
                                    log.old_value ?? null,
                                  )}
                                </p>
                              </div>
                            </div>

                            <span
                              className="hidden text-slate-400 sm:block"
                              aria-hidden="true"
                            >
                              →
                            </span>

                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                Nuevo valor
                              </p>

                              <div className="mt-1 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
                                <p className="break-words text-sm font-medium leading-6 text-emerald-700">
                                  {formatChangeLogValue(
                                    fieldName,
                                    log.new_value ?? null,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {totalPages > 1 ? (
              <footer className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Página {currentPage} de {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </footer>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
