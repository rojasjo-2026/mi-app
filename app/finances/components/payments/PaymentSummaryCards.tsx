import type { InvoiceMetrics } from "./paymentsSectionConfig";
import { formatCurrency } from "../../utils";

export function PaymentSummaryCards({
  totalItems,
  metrics,
  summaryCurrency,
}: {
  totalItems: number;
  metrics: InvoiceMetrics;
  summaryCurrency: string;
}) {
  const cards = [
    {
      label: "Facturas abiertas",
      value: String(totalItems),
      helper: "Con saldo pendiente",
    },
    {
      label: "Saldo pendiente",
      value: formatCurrency(metrics.pendingAmount, summaryCurrency),
      helper: "Por cobrar",
    },
    {
      label: "Vencido",
      value: formatCurrency(metrics.overdueAmount, summaryCurrency),
      helper: "Monto vencido",
    },
  ];

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="min-h-[92px] rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {card.label}
          </p>

          <p className="mt-2.5 text-xl font-semibold tracking-tight text-slate-950">
            {card.value}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {card.helper}
          </p>
        </article>
      ))}
    </div>
  );
}
