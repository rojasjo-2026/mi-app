import type { ReactNode } from "react";

type InfoGridProps = {
  children: ReactNode;
};

export default function InfoGrid({ children }: InfoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
  );
}
