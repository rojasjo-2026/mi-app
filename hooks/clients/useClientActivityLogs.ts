"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ActivityLogsResponse,
  ClientActivityLog,
} from "@/lib/clients/clientDetail.types";

export function useClientActivityLogs(id?: string) {
  const [activityLogs, setActivityLogs] = useState<ClientActivityLog[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(true);
  const [activityLogsError, setActivityLogsError] = useState("");
  const [take, setTake] = useState(12);
  const [hasMore, setHasMore] = useState(false);

  const loadActivityLogs = useCallback(
    async (requestedTake: number) => {
      if (!id) {
        setActivityLogs([]);
        setActivityLogsLoading(false);
        setHasMore(false);
        return;
      }

      try {
        setActivityLogsLoading(true);
        setActivityLogsError("");

        const activityRes = await fetch(
          `/api/activity-logs?client_id=${id}&take=${requestedTake}`,
          {
            cache: "no-store",
          },
        );

        const activityResult: ActivityLogsResponse = await activityRes.json();

        if (!activityRes.ok || !activityResult.success) {
          throw new Error(
            activityResult.message || "Failed to load activity logs",
          );
        }

        const logs = activityResult.data ?? [];

        setActivityLogs(logs);
        setHasMore(logs.length === requestedTake);
        setTake(requestedTake);
      } catch {
        setActivityLogsError("No se pudo cargar el historial del cliente");
      } finally {
        setActivityLogsLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void loadActivityLogs(12);
  }, [id, loadActivityLogs]);

  const loadMoreActivityLogs = useCallback(() => {
    void loadActivityLogs(take + 12);
  }, [loadActivityLogs, take]);

  return {
    activityLogs,
    activityLogsLoading,
    activityLogsError,
    reloadActivityLogs: () => void loadActivityLogs(12),
    loadMoreActivityLogs,
    hasMore,
  };
}
