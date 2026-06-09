"use client";

import Link from "next/link";
import { BarChart3, CircleCheck, Headphones, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

function getCurrentTime() {
  return new Intl.DateTimeFormat("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export default function BottomStatusBar() {
  const [lastUpdateTime, setLastUpdateTime] = useState("");

  useEffect(() => {
    setLastUpdateTime(getCurrentTime());

    const intervalId = window.setInterval(() => {
      setLastUpdateTime(getCurrentTime());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-semibold text-slate-700">
            CLARIUS Operations 360
          </span>

          <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Ambiente demo
          </span>

          <span className="inline-flex items-center gap-1.5">
            <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />
            Sistema activo
          </span>

          <span className="inline-flex items-center gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5 text-slate-400" />
            Última actualización: {lastUpdateTime || "--:--"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/finances"
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition hover:text-blue-700"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Reportes rápidos
          </Link>

          <a
            href="mailto:soporte@clarius.app"
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition hover:text-blue-700"
          >
            <Headphones className="h-3.5 w-3.5" />
            Soporte
          </a>

          <span className="font-medium text-slate-400">v1.0</span>
        </div>
      </div>
    </footer>
  );
}
