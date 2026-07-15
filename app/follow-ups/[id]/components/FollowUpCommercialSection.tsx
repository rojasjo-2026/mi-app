import type { ReactNode } from "react";
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

const controlClassName =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const textareaClassName =
  "min-h-20 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

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

function toNumber(value: unknown) {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function formatMoney(
  value?: number | string | null,
  currency?: string | null,
  locale = "es",
) {
  const amount = toNumber(value);

  if (amount === null) return "-";

  const currencyCode = currency?.trim().toUpperCase();

  if (!currencyCode) {
    return amount.toLocaleString(locale, {
      maximumFractionDigits: 0,
    });
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  }
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
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Operación y facturación
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Define el tipo de mantenimiento, técnico responsable, montos y estado
          financiero.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 md:grid-cols-2">
        <FieldCell
          label="Tipo de mantenimiento"
          helperText="Clasifica el trabajo como preventivo, correctivo, garantía u otro."
        >
          {isEditing ? (
            <select
              value={form.maintenance_type}
              onChange={(e) => onChange("maintenance_type", e.target.value)}
              className={controlClassName}
            >
              {maintenanceTypeOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <FieldValue value={maintenanceTypeLabel} />
          )}
        </FieldCell>

        <FieldCell
          label="Técnico asignado"
          helperText="Responsable operativo del mantenimiento."
        >
          {isEditing ? (
            <select
              value={form.technician_id}
              onChange={(e) => onChange("technician_id", e.target.value)}
              disabled={loadingTechnicians}
              className={controlClassName}
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
            <FieldValue value={technicianLabel} />
          )}
        </FieldCell>

        <FieldCell
          label="Monto estimado"
          helperText="Valor esperado antes de cerrar el trabajo."
        >
          {isEditing ? (
            <MoneyInput
              value={form.estimated_amount}
              placeholder="Ej: 50000"
              onChange={(value) => onChange("estimated_amount", value)}
            />
          ) : (
            <FieldValue value={estimatedAmountLabel} />
          )}
        </FieldCell>

        <FieldCell
          label="Monto final"
          helperText="Valor real utilizado para facturación cuando aplique."
        >
          {isEditing ? (
            <MoneyInput
              value={form.final_amount}
              placeholder="Ej: 65000"
              onChange={(value) => onChange("final_amount", value)}
            />
          ) : (
            <FieldValue value={finalAmountLabel} />
          )}
        </FieldCell>

        <FieldCell
          label="Costo interno"
          helperText="Costo del trabajo para controlar el margen."
        >
          {isEditing ? (
            <MoneyInput
              value={form.cost_amount}
              placeholder="Ej: 30000"
              onChange={(value) => onChange("cost_amount", value)}
            />
          ) : (
            <FieldValue value={costAmountLabel} />
          )}
        </FieldCell>

        <FieldCell
          label="Estado de facturación"
          helperText="Indica si está pendiente, facturado, pagado o no facturable."
        >
          {isEditing ? (
            <select
              value={form.billing_status}
              onChange={(e) => onChange("billing_status", e.target.value)}
              className={controlClassName}
            >
              {billingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <FieldValue value={billingStatusLabel} />
          )}
        </FieldCell>

        <FieldCell
          label="Notas de facturación"
          helperText="Información interna para cobro y condiciones comerciales."
          className="md:col-span-2"
        >
          {isEditing ? (
            <textarea
              rows={3}
              value={form.billing_notes}
              onChange={(e) => onChange("billing_notes", e.target.value)}
              className={textareaClassName}
              placeholder="Notas internas para facturación, cobro o condiciones comerciales."
            />
          ) : (
            <FieldValue value={billingNotesLabel} />
          )}
        </FieldCell>
      </div>
    </section>
  );
}

function MoneyInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      min="0"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={controlClassName}
      placeholder={placeholder}
    />
  );
}

function FieldCell({
  label,
  helperText,
  className = "",
  children,
}: {
  label: string;
  helperText: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 bg-white px-3 py-2.5 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <div className="mt-1.5">{children}</div>

      <p className="mt-1.5 text-xs leading-5 text-slate-500">{helperText}</p>
    </div>
  );
}

function FieldValue({ value }: { value?: string }) {
  return (
    <p className="break-words text-sm font-medium leading-5 text-slate-800">
      {value || "-"}
    </p>
  );
}
