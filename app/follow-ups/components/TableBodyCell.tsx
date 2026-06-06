import type { ReactNode } from "react";
import type { ColumnKey } from "../types/followUpsPageTypes";
import { getStickyBodyClass } from "../utils/followUpsPageUtils";

type TableBodyCellProps = {
  children: ReactNode;
  columnKey: ColumnKey;
  isSelected: boolean;
  className?: string;
};

export function TableBodyCell({
  children,
  columnKey,
  isSelected,
  className = "",
}: TableBodyCellProps) {
  return (
    <div
      className={[
        "flex min-w-0 items-center border-r border-slate-100 px-4 py-3 last:border-r-0",
        getStickyBodyClass(columnKey, isSelected),
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
