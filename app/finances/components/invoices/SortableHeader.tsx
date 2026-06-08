import type { InvoiceSortKey, SortDirection } from "./invoicesSectionConfig";

export function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  align = "left",
  onSortChange,
}: {
  label: string;
  sortKey: InvoiceSortKey;
  activeSortKey: InvoiceSortKey;
  sortDirection: SortDirection;
  align?: "left" | "right" | "center";
  onSortChange: (key: InvoiceSortKey) => void;
}) {
  const isActive = sortKey === activeSortKey;
  const indicator = isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕";
  const alignmentClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "justify-start text-left";

  return (
    <button
      type="button"
      title={`Ordenar por ${label}`}
      onClick={() => onSortChange(sortKey)}
      className={`flex min-w-0 items-center gap-2 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:text-slate-700 ${alignmentClass} ${
        isActive ? "text-slate-700" : "text-slate-400"
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none ${
          isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"
        }`}
      >
        {indicator}
      </span>
    </button>
  );
}
