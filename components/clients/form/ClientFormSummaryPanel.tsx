"use client";

export type CompletionItem = {
  label: string;
  completed: boolean;
};

type ClientFormSummaryPanelProps = {
  mode: "create" | "edit";
  previewName: string;
  clientTypeLabel: string;
  countryLabel: string;
  complianceLabel: string;
  whatsappOptIn: boolean;
  billingSameAsClient: boolean;
  paymentTermLabel: string;
  preferredCurrency: string;
  completedSections: number;
  totalSections: number;
  progressPercent: number;
  completionItems: CompletionItem[];
};

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-orange-50 text-orange-700"
        : tone === "info"
          ? "bg-blue-50 text-blue-700"
          : "bg-slate-50 text-slate-700";

  return (
    <div className="flex items-start justify-between gap-4 border-t border-slate-100 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <p className="shrink-0 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <span
        className={`max-w-[62%] rounded-md px-2.5 py-1 text-right text-xs font-semibold leading-5 ${toneClass}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function ClientFormSummaryPanel({
  mode,
  previewName,
  clientTypeLabel,
  countryLabel,
  complianceLabel,
  whatsappOptIn,
  billingSameAsClient,
  paymentTermLabel,
  preferredCurrency,
  completedSections,
  totalSections,
  progressPercent,
  completionItems,
}: ClientFormSummaryPanelProps) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-base">
              👤
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-950">
                Resumen del cliente
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                {mode === "create"
                  ? "Vista previa antes de guardar."
                  : "Vista previa de los cambios."}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-4 pb-3">
            <p className="shrink-0 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Nombre
            </p>

            <p className="max-w-[66%] break-words text-right text-sm font-semibold leading-5 text-slate-900">
              {previewName}
            </p>
          </div>

          <SummaryRow label="Tipo de cliente" value={clientTypeLabel} />

          <SummaryRow label="País del cliente" value={countryLabel} />

          <SummaryRow label="Perfil aplicado" value={complianceLabel} />

          <SummaryRow
            label="WhatsApp"
            value={whatsappOptIn ? "Contacto habilitado" : "Sin autorización"}
            tone={whatsappOptIn ? "success" : "warning"}
          />

          <SummaryRow
            label="Facturación"
            value={
              billingSameAsClient
                ? "Usar misma información"
                : "Datos personalizados"
            }
            tone={billingSameAsClient ? "info" : "default"}
          />

          <SummaryRow
            label="Regla comercial"
            value={`${paymentTermLabel} · ${preferredCurrency}`}
          />

          <SummaryRow
            label="Estado"
            value={mode === "create" ? "Borrador" : "Edición"}
            tone={mode === "create" ? "warning" : "info"}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-base">
            ✅
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Progreso del formulario
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Completa la información necesaria para guardar el cliente.
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-600">
          {completedSections} de {totalSections} secciones completas
        </p>

        <div className="mt-4 space-y-2">
          {completionItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-600">
                {item.label}
              </span>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.completed
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.completed ? "Listo" : "Pendiente"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-50 text-base">
            💡
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Ayuda rápida
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Completa teléfono, identificación y ubicación para conectar mejor
              este cliente con instalaciones, mantenimientos, WhatsApp y
              facturación.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-medium leading-6 text-blue-700">
          Consejo: mientras más completo esté el cliente, más útil será su
          historial operativo y la automatización de contacto.
        </div>
      </section>
    </aside>
  );
}
