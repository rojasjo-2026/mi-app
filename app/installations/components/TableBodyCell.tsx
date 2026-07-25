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
  const stickyClass =
    columnKey === "installation"
      ? [
          "sticky left-0 z-20 bg-white",
          "group-hover:bg-blue-50/70",
          "group-data-[selected=true]:bg-blue-50",
        ].join(" ")
      : getStickyBodyClass(columnKey);

  return (
    <div
      className={[
        "flex min-w-0 items-center border-r border-slate-100 px-4 py-3 last:border-r-0",
        stickyClass,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
