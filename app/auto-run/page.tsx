"use client";

import { useEffect, useState } from "react";

export default function AutoRunPage() {
  const [lastRun, setLastRun] = useState<string>("Not executed yet");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function runJob() {
      try {
        setRunning(true);

        const response = await fetch("/api/cron/run-followups", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!isMounted) return;

        setLastRun(
          `${new Date().toLocaleString()} - ${JSON.stringify(result.jobResult)}`,
        );
      } catch {
        if (!isMounted) return;
        setLastRun(`${new Date().toLocaleString()} - Error running job`);
      } finally {
        if (isMounted) {
          setRunning(false);
        }
      }
    }

    runJob();

    const interval = setInterval(runJob, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-4 p-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Follow-up automation runner
      </h1>

      <p className="text-sm text-slate-600">
        This page triggers the follow-up job every minute while it is open.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-800">
          Status: {running ? "Running..." : "Idle"}
        </p>
        <p className="mt-2 text-sm text-slate-600 break-words">
          Last run: {lastRun}
        </p>
      </div>
    </div>
  );
}
