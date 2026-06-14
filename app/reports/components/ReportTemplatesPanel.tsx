"use client";

export default function ReportTemplatesPanel() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Plantillas
      </p>

      <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
        Plantillas de reportes
      </h2>

      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Próxima fase: guardar configuraciones de columnas, filtros y fuentes
        para reutilizar reportes como “Clientes activos con WhatsApp”,
        “Facturación pendiente” o “Clientes sin instalaciones”.
      </p>
    </section>
  );
}
