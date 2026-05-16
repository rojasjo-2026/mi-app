import Link from "next/link";

export function ClientListEmptyState() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-base font-semibold text-slate-800">
        No se encontraron clientes
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Prueba con otra búsqueda o cambia los filtros.
      </p>

      <Link
        href="/clients/new"
        className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Crear nuevo cliente
      </Link>
    </section>
  );
}
