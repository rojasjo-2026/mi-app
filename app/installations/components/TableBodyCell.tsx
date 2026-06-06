import type { ReactNode } from "react";
import type { ColumnKey } from "../config/installationsPageConfig";
import { getStickyBodyClass } from "../utils/installationsPageUtils";

export function TableBodyCell({
  children,
  columnKey,
  className = "",
}: {
  children: ReactNode;
  columnKey: ColumnKey;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex min-w-0 items-center border-r border-slate-100 px-4 py-3 last:border-r-0",
        getStickyBodyClass(columnKey),
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

