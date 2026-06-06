import type { MouseEvent as ReactMouseEvent } from "react";
import type {
  ColumnKey,
  SortDirection,
  SortKey,
} from "../config/installationsPageConfig";
import { getStickyHeaderClass } from "../utils/installationsPageUtils";

export function TableHeaderCell({
  columnKey,
  label,
  onResizeStart,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
}: {
  columnKey: ColumnKey;
  label: string;
  onResizeStart: (
    event: ReactMouseEvent<HTMLSpanElement>,
    columnKey: ColumnKey,
  ) => void;
  sortKey?: SortKey;
  activeSortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (sortKey: SortKey) => void;
}) {
  const isLockedColumn =
    columnKey === "installation" || columnKey === "actions";
  const isSortable = Boolean(sortKey && columnKey !== "actions");
  const isActiveSort = sortKey === activeSortKey;
  const sortIndicator = isActiveSort
    ? sortDirection === "asc"
      ? "↑"
      : "↓"
    : "↕";

  return (
    <div
      className={[
        "relative flex h-full items-center border-r border-slate-200 px-4 py-3 last:border-r-0",
        getStickyHeaderClass(columnKey),
        columnKey === "actions" ? "justify-end text-right" : "",
      ].join(" ")}
    >
      <button
        type="button"
        disabled={!isSortable}
        title={isSortable ? `Ordenar por ${label}` : undefined}
        onClick={() => {
          if (sortKey) {
            onSort(sortKey);
          }
        }}
        className={[
          "flex min-w-0 items-center gap-2 truncate text-xs font-black uppercase tracking-[0.14em]",
          isActiveSort ? "text-slate-700" : "text-slate-400",
          isSortable
            ? "cursor-pointer transition hover:text-slate-700"
            : "cursor-default",
        ].join(" ")}
      >
        <span className="truncate">{label}</span>
        {isSortable && (
          <span
            className={[
              "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none",
              isActiveSort
                ? "bg-blue-50 text-blue-700"
                : "bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            {sortIndicator}
          </span>
        )}
      </button>

      {!isLockedColumn && (
        <span
          role="separator"
          aria-label={`Cambiar ancho de ${label}`}
          onMouseDown={(event) => onResizeStart(event, columnKey)}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize transition hover:bg-blue-200/70"
        />
      )}
    </div>
  );
}

