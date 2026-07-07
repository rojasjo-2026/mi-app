type InstallationCommercialSectionProps = {
  estimatedAmount: string;
  setEstimatedAmount: (value: string) => void;
  costAmount: string;
  setCostAmount: (value: string) => void;
  billingStatus: string;
  setBillingStatus: (value: string) => void;
  billingNotes: string;
  setBillingNotes: (value: string) => void;
  currencyCode?: string;
};

const inputClassName =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const textareaClassName =
  "min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function normalizeCurrencyCode(value?: string | null) {
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  return normalizedValue || "moneda configurada";
}

export default function InstallationCommercialSection({
  estimatedAmount,
  setEstimatedAmount,
  costAmount,
  setCostAmount,
  billingStatus,
  setBillingStatus,
  billingNotes,
  setBillingNotes,
  currencyCode,
}: InstallationCommercialSectionProps) {
  const businessCurrency = normalizeCurrencyCode(currencyCode);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Precio de instalación ({businessCurrency})
        </label>

        <input
          type="number"
          min="0"
          value={estimatedAmount}
          onChange={(e) => setEstimatedAmount(e.target.value)}
          className={inputClassName}
          placeholder={`Monto estimado en ${businessCurrency}`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Costo interno ({businessCurrency})
        </label>

        <input
          type="number"
          min="0"
          value={costAmount}
          onChange={(e) => setCostAmount(e.target.value)}
          className={inputClassName}
          placeholder={`Costo interno en ${businessCurrency}`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Estado de facturación
        </label>

        <select
          value={billingStatus}
          onChange={(e) => setBillingStatus(e.target.value)}
          className={inputClassName}
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
          value={billingNotes}
          onChange={(e) => setBillingNotes(e.target.value)}
          className={textareaClassName}
          placeholder="Notas internas para facturación, cobro o condiciones comerciales."
        />
      </div>
    </div>
  );
}
