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

  const loadActivityLogs = useCallback(async () => {
    if (!id) {
      setActivityLogs([]);
      setActivityLogsLoading(false);
      return;
    }

    try {
      setActivityLogsLoading(true);
      setActivityLogsError("");

      const activityRes = await fetch(
        `/api/activity-logs?client_id=${id}&take=100`,
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

      setActivityLogs(activityResult.data ?? []);
    } catch {
      setActivityLogsError("No se pudo cargar el historial del cliente");
    } finally {
      setActivityLogsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadActivityLogs();
  }, [loadActivityLogs]);

  return {
    activityLogs,
    activityLogsLoading,
    activityLogsError,
    reloadActivityLogs: loadActivityLogs,
  };
}
