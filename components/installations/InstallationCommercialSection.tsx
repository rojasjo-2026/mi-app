type InstallationCommercialSectionProps = {
  estimatedAmount: string;
  setEstimatedAmount: (value: string) => void;
  costAmount: string;
  setCostAmount: (value: string) => void;
  billingStatus: string;
  setBillingStatus: (value: string) => void;
  billingNotes: string;
  setBillingNotes: (value: string) => void;
};

export default function InstallationCommercialSection({
  estimatedAmount,
  setEstimatedAmount,
  costAmount,
  setCostAmount,
  billingStatus,
  setBillingStatus,
  billingNotes,
  setBillingNotes,
}: InstallationCommercialSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Información comercial
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Define el monto, costo y estado de facturación de esta instalación.
          </p>
        </div>

        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Finanzas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Precio de instalación
          </label>
          <input
            type="number"
            min="0"
            value={estimatedAmount}
            onChange={(e) => setEstimatedAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Ej: 50000"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Costo interno
          </label>
          <input
            type="number"
            min="0"
            value={costAmount}
            onChange={(e) => setCostAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Ej: 30000"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Estado de facturación
          </label>
          <select
            value={billingStatus}
            onChange={(e) => setBillingStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="PENDING">Pendiente por facturar</option>
            <option value="INVOICED">Facturado</option>
            <option value="PARTIALLY_PAID">Parcialmente pagado</option>
            <option value="PAID">Pagado</option>
            <option value="NOT_BILLABLE">No facturable</option>
            <option value="BILLING_ERROR">Error de facturación</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notas de facturación
          </label>
          <textarea
            rows={3}
            value={billingNotes}
            onChange={(e) => setBillingNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Notas internas para facturación, cobro o condiciones comerciales."
          />
        </div>
      </div>
    </section>
  );
}
