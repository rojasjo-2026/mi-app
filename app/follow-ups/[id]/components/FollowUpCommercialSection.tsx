import type { FollowUpEditForm } from "../utils";

type TechnicianOption = {
  user_id: string;
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  email?: string | null;
};

type FollowUpCommercialSectionProps = {
  isEditing: boolean;
  form: FollowUpEditForm;
  estimatedAmountLabel: string;
  finalAmountLabel?: string;
  costAmountLabel: string;
  billingStatusLabel: string;
  billingNotesLabel: string;
  maintenanceTypeLabel?: string;
  technicianLabel?: string;
  technicians?: TechnicianOption[];
  loadingTechnicians?: boolean;
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

const maintenanceTypeOptions = [
  { value: "", label: "Sin tipo definido" },
  { value: "PREVENTIVE", label: "Preventivo" },
  { value: "CORRECTIVE", label: "Correctivo" },
  { value: "WARRANTY", label: "Garantía" },
  { value: "INSPECTION", label: "Inspección" },
  { value: "OTHER", label: "Otro" },
];

function getTechnicianName(technician?: TechnicianOption | null) {
  const composedName = [
    technician?.first_name,
    technician?.last_name_1,
    technician?.last_name_2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || technician?.email || "Técnico sin nombre";
}

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

export function formatMaintenanceType(value?: string | null) {
  if (!value) return "-";

  return (
    maintenanceTypeOptions.find((option) => option.value === value)?.label ??
    value
  );
}

export default function FollowUpCommercialSection({
  isEditing,
  form,
  estimatedAmountLabel,
  finalAmountLabel = "-",
  costAmountLabel,
  billingStatusLabel,
  billingNotesLabel,
  maintenanceTypeLabel = "-",
  technicianLabel = "-",
  technicians = [],
  loadingTechnicians = false,
  onChange,
}: FollowUpCommercialSectionProps) {
  const hasCurrentTechnicianOutsideList =
    Boolean(form.technician_id) &&
    !technicians.some((item) => item.user_id === form.technician_id);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Información comercial
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Datos financieros y operativos asociados a este mantenimiento.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          Finanzas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Tipo de mantenimiento
          </p>

          {isEditing ? (
            <select
              value={form.maintenance_type}
              onChange={(e) => onChange("maintenance_type", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {maintenanceTypeOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {maintenanceTypeLabel}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Técnico asignado
          </p>

          {isEditing ? (
            <select
              value={form.technician_id}
              onChange={(e) => onChange("technician_id", e.target.value)}
              disabled={loadingTechnicians}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {loadingTechnicians
                  ? "Cargando técnicos..."
                  : "Sin técnico asignado"}
              </option>

              {hasCurrentTechnicianOutsideList ? (
                <option value={form.technician_id}>
                  {technicianLabel !== "-"
                    ? technicianLabel
                    : "Técnico asignado actual"}
                </option>
              ) : null}

              {technicians.map((item) => (
                <option key={item.user_id} value={item.user_id}>
                  {getTechnicianName(item)}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {technicianLabel}
            </p>
          )}
        </div>

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
            Monto final
          </p>

          {isEditing ? (
            <input
              type="number"
              min="0"
              value={form.final_amount}
              onChange={(e) => onChange("final_amount", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Ej: 65000"
            />
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {finalAmountLabel}
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
