import type {
  ColumnKey,
  PaymentSortKey,
  SortDirection,
} from "./paymentsSectionConfig";

export function SortableHeader({
  columnKey,
  label,
  activeSortKey,
  sortDirection,
  onSortChange,
  align = "left",
}: {
  columnKey: ColumnKey;
  label: string;
  activeSortKey: PaymentSortKey;
  sortDirection: SortDirection;
  onSortChange: (key: PaymentSortKey) => void;
  align?: "left" | "right" | "center";
}) {
  const isSortable = columnKey !== "action";
  const isActive = isSortable && columnKey === activeSortKey;
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
      disabled={!isSortable}
      title={isSortable ? `Ordenar por ${label}` : undefined}
      onClick={() => {
        if (isSortable) onSortChange(columnKey as PaymentSortKey);
      }}
      className={`flex min-w-0 items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition ${alignmentClass} ${
        isActive ? "text-slate-700" : "text-slate-400"
      } ${isSortable ? "hover:text-slate-700" : "cursor-default"}`}
    >
      <span className="truncate">{label}</span>
      {isSortable && (
        <span
          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none ${
            isActive
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {indicator}
        </span>
      )}
    </button>
  );
}

