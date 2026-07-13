"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ActivityLogsResponse,
  ClientActivityLog,
} from "@/lib/clients/clientDetail.types";

type ActivityLogFilters = {
  entityType?: string;
  entityId?: string;
  category?: string;
};

const ACTIVITY_LOGS_PAGE_SIZE = 6;

export function useClientActivityLogs(
  id?: string,
  filters: ActivityLogFilters = {},
) {
  const [activityLogs, setActivityLogs] = useState<ClientActivityLog[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(true);
  const [activityLogsError, setActivityLogsError] = useState("");
  const [activityLogsPage, setActivityLogsPage] = useState(1);
  const [hasNextActivityLogsPage, setHasNextActivityLogsPage] = useState(false);

  const entityType = filters.entityType?.trim() || "";
  const entityId = filters.entityId?.trim() || "";
  const category = filters.category?.trim().toUpperCase() || "";

  const loadActivityLogs = useCallback(
    async (requestedPage: number) => {
      const normalizedPage = Math.max(Math.trunc(requestedPage), 1);

      if (!id) {
        setActivityLogs([]);
        setActivityLogsLoading(false);
        setActivityLogsError("");
        setActivityLogsPage(1);
        setHasNextActivityLogsPage(false);
        return;
      }

      try {
        setActivityLogsLoading(true);
        setActivityLogsError("");

        const params = new URLSearchParams({
          client_id: id,
          take: String(ACTIVITY_LOGS_PAGE_SIZE + 1),
          skip: String((normalizedPage - 1) * ACTIVITY_LOGS_PAGE_SIZE),
        });

        if (entityType && entityId) {
          params.set("entity_type", entityType);
          params.set("entity_id", entityId);
        }

        if (category && category !== "ALL") {
          params.set("category", category);
        }

        const activityRes = await fetch(`/api/activity-logs?${params}`, {
          cache: "no-store",
        });

        const activityResult: ActivityLogsResponse = await activityRes.json();

        if (!activityRes.ok || !activityResult.success) {
          throw new Error(
            activityResult.message || "Failed to load activity logs",
          );
        }

        const logs = activityResult.data ?? [];

        setActivityLogs(logs.slice(0, ACTIVITY_LOGS_PAGE_SIZE));
        setHasNextActivityLogsPage(logs.length > ACTIVITY_LOGS_PAGE_SIZE);
        setActivityLogsPage(normalizedPage);
      } catch {
        setActivityLogsError("No se pudo cargar el historial del cliente");
      } finally {
        setActivityLogsLoading(false);
      }
    },
    [id, entityType, entityId, category],
  );

  useEffect(() => {
    void loadActivityLogs(1);
  }, [loadActivityLogs]);

  const reloadActivityLogs = useCallback(() => {
    void loadActivityLogs(activityLogsPage);
  }, [activityLogsPage, loadActivityLogs]);

  const goToPreviousActivityLogsPage = useCallback(() => {
    if (activityLogsLoading || activityLogsPage <= 1) {
      return;
    }

    void loadActivityLogs(activityLogsPage - 1);
  }, [activityLogsLoading, activityLogsPage, loadActivityLogs]);

  const goToNextActivityLogsPage = useCallback(() => {
    if (activityLogsLoading || !hasNextActivityLogsPage) {
      return;
    }

    void loadActivityLogs(activityLogsPage + 1);
  }, [
    activityLogsLoading,
    activityLogsPage,
    hasNextActivityLogsPage,
    loadActivityLogs,
  ]);

  return {
    activityLogs,
    activityLogsLoading,
    activityLogsError,
    activityLogsPage,
    reloadActivityLogs,
    goToPreviousActivityLogsPage,
    goToNextActivityLogsPage,
    hasPreviousActivityLogsPage: activityLogsPage > 1,
    hasNextActivityLogsPage,
    activityLogsPageSize: ACTIVITY_LOGS_PAGE_SIZE,
  };
}
