"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";

type TableRow = {
  report: string;
  category: string;
  status: string;
  priority: string;
  updatedAt?: string;
  route: string;
};

type ReportsTablePreviewProps = {
  rows: TableRow[];
};

function formatDate(value?: string, locale = "es") {
  if (!value) return "Sin actualizar";

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "No disponible";
  }
}

function getPriorityClass(priority: string) {
  if (priority === "Alta") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (priority === "Media") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

export default function ReportsTablePreview({
  rows,
}: ReportsTablePreviewProps) {
  const { businessCountryMeta } = useAppSettings();
  const locale = businessCountryMeta.locale || "es";

  function handleOpenReport(route: string) {
    console.log(`Vista previa preparada para futura ruta: ${route}`);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Vista previa operativa
        </p>

        <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
          Reportes principales
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Tabla limpia tipo Excel para revisar reportes, estado, prioridad y
          última actualización.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <th className="border-b border-slate-200 px-4 py-3">Reporte</th>
              <th className="border-b border-slate-200 px-4 py-3">Categoría</th>
              <th className="border-b border-slate-200 px-4 py-3">Estado</th>
              <th className="border-b border-slate-200 px-4 py-3">Prioridad</th>
              <th className="border-b border-slate-200 px-4 py-3">
                Última actualización
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-right">
                Acción
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={`${row.category}-${row.report}`} className="group">
                <td className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {row.report}
                  </p>
                </td>

                <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                  {row.category}
                </td>

                <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                  {row.status}
                </td>

                <td className="border-b border-slate-100 px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getPriorityClass(
                      row.priority,
                    )}`}
                  >
                    {row.priority}
                  </span>
                </td>

                <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-500">
                  {formatDate(row.updatedAt, locale)}
                </td>

                <td className="border-b border-slate-100 px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleOpenReport(row.route)}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver reporte
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
