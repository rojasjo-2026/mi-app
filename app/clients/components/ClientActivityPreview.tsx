"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ActivityLogItem = {
  activity_id: string;
  title: string;
  description?: string | null;
  category: string;
  action: string;
  created_at: string;
};

type ClientActivityPreviewProps = {
  clientId: string;
};

function formatActivityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getActivityIcon(category: string) {
  switch (category) {
    case "INSTALLATION":
      return "🛠️";

    case "FOLLOW_UP":
      return "✅";

    case "CONTACT":
      return "💬";

    case "FINANCE":
      return "💳";

    case "FILE":
      return "📎";

    case "SYSTEM":
      return "⚙️";

    default:
      return "•";
  }
}

export function ClientActivityPreview({
  clientId,
}: ClientActivityPreviewProps) {
  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivity() {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          client_id: clientId,
          take: "4",
        });

        const response = await fetch(
          `/api/activity-logs?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          setItems([]);
          return;
        }

        setItems(result.data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadActivity();

    return () => controller.abort();
  }, [clientId]);

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          Actividad reciente
        </p>

        <Link
          href={`/clients/${clientId}`}
          className="text-xs font-semibold text-blue-700 transition hover:text-blue-800"
        >
          Ver todo
        </Link>
      </div>

      <div className="mt-3 max-h-[180px] space-y-2 overflow-hidden">
        {loading ? (
          <div className="rounded-md bg-white px-3 py-2">
            <p className="text-xs font-medium text-slate-500">
              Cargando actividad...
            </p>
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="rounded-md bg-white px-3 py-2">
            <p className="text-xs font-semibold text-slate-800">
              Sin actividad reciente
            </p>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Todavía no hay eventos registrados para este cliente.
            </p>
          </div>
        ) : null}

        {!loading
          ? items.map((item) => (
              <div
                key={item.activity_id}
                className="rounded-md bg-white px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs">
                      {getActivityIcon(item.category)}
                    </span>

                    <div className="min-w-0">
                      <p
                        title={item.title}
                        className="truncate text-xs font-semibold text-slate-800"
                      >
                        {item.title}
                      </p>

                      {item.description ? (
                        <p
                          title={item.description}
                          className="mt-0.5 truncate text-xs font-medium text-slate-500"
                        >
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <p className="shrink-0 text-xs font-semibold text-slate-500">
                    {formatActivityDate(item.created_at)}
                  </p>
                </div>
              </div>
            ))
          : null}
      </div>
    </section>
  );
}
