"use client";

import {
  AlertTriangle,
  Boxes,
  Building2,
  CalendarClock,
  ChevronRight,
  Globe2,
  MapPin,
  Navigation,
  Network,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Star,
  Warehouse,
  X,
} from "lucide-react";

import type { InventoryLocationDetail } from "../types";
import {
  formatInventoryLocationDateTime,
  getInventoryLocationAddressLabel,
  getInventoryLocationBalancesLabel,
  getInventoryLocationCoordinatesLabel,
  getInventoryLocationCountryLabel,
  getInventoryLocationStatusClass,
  getInventoryLocationStatusLabel,
  getInventoryLocationTypeLabel,
} from "../utils/inventoryLocationUi";

type InventoryLocationPreviewPanelProps = {
  detail: InventoryLocationDetail | null;
  loading: boolean;
  error: string | null;
  changingStatus: boolean;
  actionError: string | null;
  locale: string;
  onClose: () => void;
  onEdit: () => void;
  onCreateChild: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onSelectChild: (locationId: string) => void;
};

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="break-words text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function LoadingContent() {
  return (
    <div className="space-y-4 p-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-lg border border-slate-200 p-4"
        >
          <div className="h-4 w-36 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function InventoryLocationPreviewPanel({
  detail,
  loading,
  error,
  changingStatus,
  actionError,
  locale,
  onClose,
  onEdit,
  onCreateChild,
  onDeactivate,
  onReactivate,
  onSelectChild,
}: InventoryLocationPreviewPanelProps) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/10">
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer"
      />

      <aside className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Ubicación seleccionada
              </p>

              <h2 className="mt-1 break-words text-xl font-bold text-slate-950">
                {detail?.name ||
                  (loading ? "Cargando ubicación" : "Detalle de ubicación")}
              </h2>

              {detail ? (
                <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                  {detail.location_code} ·{" "}
                  {getInventoryLocationTypeLabel(detail.location_type)}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="Cerrar panel"
            >
              <X className="size-4" />
            </button>
          </div>

          {detail ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Pencil className="size-4" />
                Editar ubicación
              </button>

              <button
                type="button"
                onClick={onCreateChild}
                disabled={!detail.is_active}
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" />
                Agregar sububicación
              </button>

              {detail.is_active ? (
                <button
                  type="button"
                  onClick={onDeactivate}
                  disabled={changingStatus}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Power className="size-4" />
                  Desactivar ubicación
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onReactivate}
                  disabled={changingStatus}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="size-4" />
                  Reactivar ubicación
                </button>
              )}
            </div>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? <LoadingContent /> : null}

          {!loading && error ? (
            <div className="p-5">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />

                  <div>
                    <h3 className="text-sm font-bold text-red-900">
                      No fue posible cargar el detalle
                    </h3>

                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && detail ? (
            <div className="space-y-4 p-5">
              {actionError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {actionError}
                </div>
              ) : null}

              <section className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-slate-500" />

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Información general
                      </h3>

                      <p className="text-xs text-slate-500">
                        Identificación, tipo y estado.
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="px-4">
                  <DetailRow label="Nombre" value={detail.name} />

                  <DetailRow label="Código" value={detail.location_code} />

                  <DetailRow
                    label="Tipo"
                    value={getInventoryLocationTypeLabel(detail.location_type)}
                  />

                  <div className="grid gap-1 border-b border-slate-100 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Estado
                    </dt>

                    <dd>
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                          getInventoryLocationStatusClass(detail),
                        ].join(" ")}
                      >
                        {getInventoryLocationStatusLabel(detail)}
                      </span>
                    </dd>
                  </div>

                  <DetailRow
                    label="Descripción"
                    value={detail.description || "Sin descripción"}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Network className="size-4 text-slate-500" />

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Jerarquía y operación
                      </h3>

                      <p className="text-xs text-slate-500">
                        Relación con otras ubicaciones y existencias.
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="px-4">
                  <DetailRow
                    label="Ubicación padre"
                    value={
                      detail.parent
                        ? `${detail.parent.name} · ${detail.parent.location_code}`
                        : "Ubicación principal"
                    }
                  />

                  <DetailRow
                    label="Sububicaciones"
                    value={
                      detail.children_count === 1
                        ? "1 ubicación secundaria"
                        : `${detail.children_count} ubicaciones secundarias`
                    }
                  />

                  <DetailRow
                    label="Almacenamiento"
                    value={
                      detail.allows_stock
                        ? "Permite registrar existencias"
                        : "No permite registrar existencias"
                    }
                  />

                  <DetailRow
                    label="Balances"
                    value={getInventoryLocationBalancesLabel(
                      detail.stock_balances_count,
                    )}
                  />

                  <DetailRow
                    label="Predeterminada"
                    value={
                      detail.is_default ? "Sí, ubicación predeterminada" : "No"
                    }
                  />

                  <DetailRow label="Orden" value={String(detail.sort_order)} />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-slate-500" />

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Ubicación física
                      </h3>

                      <p className="text-xs text-slate-500">
                        País, dirección y coordenadas.
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="px-4">
                  <DetailRow
                    label="País"
                    value={getInventoryLocationCountryLabel(detail)}
                  />

                  <DetailRow
                    label="Dirección"
                    value={getInventoryLocationAddressLabel(detail)}
                  />

                  <DetailRow
                    label="Coordenadas"
                    value={getInventoryLocationCoordinatesLabel(detail)}
                  />
                </dl>

                {detail.latitude && detail.longitude ? (
                  <div className="border-t border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Navigation className="size-3.5" />
                      Coordenadas registradas para referencia operativa.
                    </div>
                  </div>
                ) : null}
              </section>

              {detail.children.length > 0 ? (
                <section className="rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Warehouse className="size-4 text-slate-500" />

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Sububicaciones
                        </h3>

                        <p className="text-xs text-slate-500">
                          Ubicaciones contenidas directamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {detail.children.map((child) => (
                      <button
                        key={child.inventory_location_id}
                        type="button"
                        onClick={() =>
                          onSelectChild(child.inventory_location_id)
                        }
                        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-bold text-slate-900">
                            {child.name}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {child.location_code} ·{" "}
                            {getInventoryLocationTypeLabel(child.location_type)}
                          </p>
                        </div>

                        <ChevronRight className="size-4 shrink-0 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-slate-500" />

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Auditoría
                      </h3>

                      <p className="text-xs text-slate-500">
                        Fechas de registro y última actualización.
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="px-4">
                  <DetailRow
                    label="Creada"
                    value={formatInventoryLocationDateTime(
                      detail.created_at,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Actualizada"
                    value={formatInventoryLocationDateTime(
                      detail.updated_at,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Identificador"
                    value={detail.inventory_location_id}
                  />
                </dl>
              </section>

              {detail.is_default ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <Star className="mt-0.5 size-4 shrink-0 text-amber-600" />

                  <p className="text-sm font-semibold text-amber-800">
                    Esta es la ubicación predeterminada del inventario.
                  </p>
                </div>
              ) : null}

              {detail.stock_balances_count > 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <Boxes className="mt-0.5 size-4 shrink-0 text-blue-600" />

                  <p className="text-sm font-semibold text-blue-800">
                    Esta ubicación tiene balances de inventario asociados.
                  </p>
                </div>
              ) : null}

              {detail.country_code ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Globe2 className="size-3.5" />
                  Código de país: {detail.country_code}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
