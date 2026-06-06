import type { PendingBillable } from "../../types";
import {
  formatCurrency,
  formatDateLabel,
  getBillingStatusClass,
  getBillingStatusLabel,
  toSafeNumber,
} from "../../utils";
import {
  getItemAmount,
  getTypeLabel,
} from "./pendingBillablesSectionUtils";
import { DetailField } from "./DetailField";

export function PendingBillablePanel({
  item,
  businessCurrency,
  businessLocale,
  onSelectBillable,
}: {
  item: PendingBillable | null;
  businessCurrency: string;
  businessLocale: string;
  onSelectBillable: (item: PendingBillable) => void;
}) {
  if (!item) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-bold text-slate-800">Detalle del trabajo</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona un trabajo pendiente para ver el detalle y generar la
          factura.
        </p>
      </aside>
    );
  }

  const amount = getItemAmount(item);
  const cost = toSafeNumber(item.cost_amount);
  const profit = amount - cost;
  const profitPercentage = amount > 0 ? (profit / amount) * 100 : 0;

  return (
    <aside className="sticky top-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Detalle del trabajo
        </p>

        <h2
          title={item.description || "Trabajo sin descripción"}
          className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-slate-950"
        >
          {item.description || "Trabajo sin descripción"}
        </h2>

        <p
          title={item.client_name || "Cliente sin nombre"}
          className="mt-1 truncate text-sm font-bold text-slate-600"
        >
          {item.client_name || "Cliente sin nombre"}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {getTypeLabel(item)}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${getBillingStatusClass(
              item.billing_status,
            )}`}
          >
            {getBillingStatusLabel(item.billing_status)}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <DetailField
            label="Fecha"
            value={formatDateLabel(item.date, businessLocale)}
          />
          <DetailField
            label="Monto estimado"
            value={formatCurrency(amount, businessCurrency, businessLocale)}
          />
          <DetailField
            label="Costo estimado"
            value={formatCurrency(cost, businessCurrency, businessLocale)}
          />
          <DetailField
            label="Utilidad estimada"
            value={formatCurrency(profit, businessCurrency, businessLocale)}
          />
          <DetailField label="Teléfono" value={item.client_phone || "-"} />
          <DetailField label="Origen" value={getTypeLabel(item)} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">
            Resumen financiero
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Monto</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(amount, businessCurrency, businessLocale)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Costo</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(cost, businessCurrency, businessLocale)}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-slate-200 pt-2">
              <span className="text-slate-500">Utilidad</span>
              <span className="font-black text-emerald-700">
                {formatCurrency(profit, businessCurrency, businessLocale)} ·{" "}
                {profitPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {item.billing_notes && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Notas de facturación
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.billing_notes}
            </p>
          </div>
        )}

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => onSelectBillable(item)}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Generar factura
          </button>

          {item.client_id && (
            <a
              href={`/clients/${item.client_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Ver cliente
            </a>
          )}

          {item.installation_id && (
            <a
              href={`/installations/${item.installation_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver instalación
            </a>
          )}

          {item.follow_up_id && (
            <a
              href={`/follow-ups/${item.follow_up_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver mantenimiento
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}

