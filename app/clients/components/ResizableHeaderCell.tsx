import type { MouseEvent as ReactMouseEvent } from "react";
import type {
  ClientTableColumnKey,
  SortDirection,
  SortKey,
} from "../config/clientsPageConfig";

type ResizableHeaderCellProps = {
  label: string;
  columnKey: ClientTableColumnKey;
  onResizeStart: (
    event: ReactMouseEvent<HTMLSpanElement>,
    columnKey: ClientTableColumnKey,
  ) => void;
  align?: "left" | "center" | "right";
  resizable?: boolean;
  sortKey?: SortKey;
  activeSortKey: SortKey;
  sortDirection: SortDirection;
  onSort?: (sortKey: SortKey) => void;
  sticky?: "left";
};

export function ResizableHeaderCell({
  label,
  columnKey,
  onResizeStart,
  align = "left",
  resizable = true,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
  sticky,
}: ResizableHeaderCellProps) {
  const alignmentClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "justify-start text-left";

  const stickyClass =
    sticky === "left"
      ? "sticky left-0 z-30 border-r border-slate-200 bg-slate-50 shadow-[10px_0_18px_-18px_rgba(15,23,42,0.35)]"
      : "";

  const isSortable = Boolean(sortKey && onSort);
  const isActiveSort = sortKey === activeSortKey;

  const sortIndicator = isActiveSort
    ? sortDirection === "asc"
      ? "↑"
      : "↓"
    : "↕";

  const containerClassName = [
    "relative flex min-w-0 items-center border-l border-slate-200 px-4 py-2.5 first:border-l-0",
    alignmentClass,
    stickyClass,
  ].join(" ");

  const buttonClassName = [
    "flex min-w-0 items-center gap-2 truncate text-[11px] font-semibold uppercase tracking-[0.12em]",
    isActiveSort ? "text-slate-700" : "text-slate-400",
    isSortable
      ? "cursor-pointer transition hover:text-slate-700"
      : "cursor-default",
  ].join(" ");

  const indicatorClassName = [
    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none",
    isActiveSort ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400",
  ].join(" ");

  return (
    <div className={containerClassName}>
      <button
        type="button"
        disabled={!isSortable}
        title={isSortable ? `Ordenar por ${label}` : undefined}
        onClick={() => {
          if (sortKey && onSort) {
            onSort(sortKey);
          }
        }}
        className={buttonClassName}
      >
        <span className="truncate">{label}</span>

        {isSortable && (
          <span className={indicatorClassName}>{sortIndicator}</span>
        )}
      </button>

      {resizable && (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={`Cambiar ancho de columna ${label}`}
          onMouseDown={(event) => onResizeStart(event, columnKey)}
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none transition hover:bg-blue-300/50"
        />
      )}
    </div>
  );
}
