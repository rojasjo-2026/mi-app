import Link from "next/link";

import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  FileText,
  Package,
  Scale,
  Tags,
  Warehouse,
} from "lucide-react";

type InventoryModuleNavProps = {
  activeKey:
    | "stock"
    | "reservations"
    | "documents"
    | "movements"
    | "products"
    | "categories";
};

const operationItems = [
  {
    key: "stock",
    label: "Existencias",
    href: "/inventory/stock",
    icon: Boxes,
    available: true,
  },
  {
    key: "reservations",
    label: "Reservas",
    href: "/inventory/reservations",
    icon: ClipboardList,
    available: true,
  },
  {
    key: "documents",
    label: "Operaciones",
    href: "/inventory/documents",
    icon: FileText,
    available: true,
  },
  {
    key: "movements",
    label: "Movimientos",
    href: "/inventory/movements",
    icon: ArrowLeftRight,
    available: true,
  },
] as const;

const catalogItems = [
  {
    label: "Productos",
    icon: Package,
  },
  {
    label: "Categorías",
    icon: Tags,
  },
  {
    label: "Unidades",
    icon: Scale,
  },
  {
    label: "Ubicaciones",
    icon: Warehouse,
  },
] as const;

export default function InventoryModuleNav({
  activeKey,
}: InventoryModuleNavProps) {
  return (
    <nav
      aria-label="Navegación del módulo de inventario"
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <p className="shrink-0 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Inventario
          </p>

          <div className="flex min-w-0 flex-wrap gap-1.5">
            {operationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeKey;

              if (!item.available) {
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled
                    title="Disponible en una siguiente fase del modulo"
                    className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border border-transparent px-3 text-sm font-semibold text-slate-400 opacity-70"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <p className="shrink-0 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Catálogo
          </p>

          <div className="flex min-w-0 flex-wrap gap-1.5">
            {catalogItems.map((item) => {
              const Icon = item.icon;

              if (item.label === "Productos" || item.label === "Categorías") {
                const itemKey =
                  item.label === "Productos" ? "products" : "categories";

                const isActive = activeKey === itemKey;

                return (
                  <Link
                    key={item.label}
                    href={
                      item.label === "Productos"
                        ? "/inventory/products"
                        : "/inventory/categories"
                    }
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
                      isActive
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  title="Disponible en una siguiente fase del modulo"
                  className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border border-transparent px-3 text-sm font-semibold text-slate-400 opacity-70"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
