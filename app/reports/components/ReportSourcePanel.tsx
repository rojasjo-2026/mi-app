"use client";

export default function ReportSourcePanel() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Fuente de datos
      </p>

      <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
        Clientes
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        Primera fuente activa del generador. Luego se pueden agregar
        instalaciones, mantenimientos, finanzas y auditoría.
      </p>

      <div className="mt-4 grid gap-2">
        {[
          "Clientes",
          "Instalaciones",
          "Mantenimientos",
          "Finanzas",
          "Actividad operativa",
        ].map((source, index) => (
          <div
            key={source}
            className={[
              "rounded-md border px-3 py-2.5 text-sm font-semibold",
              index === 0
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-slate-200 bg-slate-50 text-slate-400",
            ].join(" ")}
          >
            {source}
            {index !== 0 && (
              <span className="ml-2 text-[11px] font-medium">Próxima fase</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
