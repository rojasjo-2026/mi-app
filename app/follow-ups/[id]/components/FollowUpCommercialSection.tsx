import type { FollowUpEditForm } from "../utils";

type FollowUpCommercialSectionProps = {
  isEditing: boolean;
  form: FollowUpEditForm;
  estimatedAmountLabel: string;
  costAmountLabel: string;
  billingStatusLabel: string;
  billingNotesLabel: string;
  onChange: <K extends keyof FollowUpEditForm>(
    field: K,
    value: FollowUpEditForm[K],
  ) => void;
};

const billingStatusOptions = [
  { value: "PENDING", label: "Pendiente por facturar" },
  { value: "INVOICED", label: "Facturado" },
  { value: "PARTIALLY_PAID", label: "Parcialmente pagado" },
  { value: "PAID", label: "Pagado" },
  { value: "NOT_BILLABLE", label: "No facturable" },
  { value: "BILLING_ERROR", label: "Error de facturación" },
  { value: "CANCELLED", label: "Cancelado" },
];

export function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatBillingStatus(value?: string | null) {
  if (!value) return "-";

  return (
    billingStatusOptions.find((option) => option.value === value)?.label ??
    value
  );
}

export default function FollowUpCommercialSection({
  isEditing,
  form,
  estimatedAmountLabel,
  costAmountLabel,
  billingStatusLabel,
  billingNotesLabel,
  onChange,
}: FollowUpCommercialSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Información comercial
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Datos financieros asociados a este mantenimiento.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          Finanzas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Monto estimado
          </p>

          {isEditing ? (
            <input
              type="number"
              min="0"
              value={form.estimated_amount}
              onChange={(e) => onChange("estimated_amount", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Ej: 50000"
            />
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {estimatedAmountLabel}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Costo interno
          </p>

          {isEditing ? (
            <input
              type="number"
              min="0"
              value={form.cost_amount}
              onChange={(e) => onChange("cost_amount", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Ej: 30000"
            />
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {costAmountLabel}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Estado de facturación
          </p>

          {isEditing ? (
            <select
              value={form.billing_status}
              onChange={(e) => onChange("billing_status", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {billingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {billingStatusLabel}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Notas de facturación
          </p>

          {isEditing ? (
            <textarea
              rows={3}
              value={form.billing_notes}
              onChange={(e) => onChange("billing_notes", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Notas internas para facturación, cobro o condiciones comerciales."
            />
          ) : (
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
              {billingNotesLabel}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
