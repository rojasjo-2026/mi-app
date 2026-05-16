import Link from "next/link";

type ClientListHeaderProps = {
  filteredCount: number;
  totalCount: number;
};

export function ClientListHeader({
  filteredCount,
  totalCount,
}: ClientListHeaderProps) {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Gestión de clientes
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {filteredCount} de {totalCount} clientes
          </p>
        </div>
      </div>

      <Link
        href="/clients/new"
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        + Nuevo cliente
      </Link>
    </section>
  );
}
