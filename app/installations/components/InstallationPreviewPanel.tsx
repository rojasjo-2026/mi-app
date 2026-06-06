import Link from "next/link";
import type { InstallationItem } from "../config/installationsPageConfig";
import { DetailField } from "./DetailField";
import {
  formatCurrency,
  formatDateLabel,
  getClientName,
  getInstallationStatusLabel,
  getLocationLabel,
  getStatusBadgeClass,
} from "../utils/installationsPageUtils";

export function InstallationPreviewPanel({
  installation,
  businessCurrency,
  businessLocale,
}: {
  installation: InstallationItem | null;
  businessCurrency: string;
  businessLocale: string;
}) {
  if (!installation) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-bold text-slate-800">
          Resumen de instalación
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona una instalación de la tabla para ver su información y
          acciones rápidas.
        </p>
      </aside>
    );
  }

  const installationName =
    installation.description || "Instalación sin descripción";
  const clientName = getClientName(installation.client);
  const serviceName = installation.service_type?.name || "Sin servicio";
  const technicianName = installation.technician_name || "Técnico no asignado";
  const location = getLocationLabel(installation);
  const statusLabel = getInstallationStatusLabel(
    installation.installation_status,
  );
  const statusClass = getStatusBadgeClass(installation.installation_status);
  const amount = formatCurrency(
    installation.estimated_amount,
    businessCurrency,
    businessLocale,
  );
  const installationDate = formatDateLabel(
    installation.installation_date,
    businessLocale,
  );

  return (
    <aside className="sticky top-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Resumen de instalación
        </p>

        <h2
          title={installationName}
          className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-slate-950"
        >
          {installationName}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
          >
            {statusLabel}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {serviceName}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <DetailField label="Cliente" value={clientName} />
          <DetailField
            label="Teléfono"
            value={installation.client?.phone_primary || "Sin teléfono"}
          />
          <DetailField label="Fecha" value={installationDate} />
          <DetailField label="Técnico" value={technicianName} />
          <DetailField label="Ubicación" value={location} />
          <DetailField label="Monto estimado" value={amount} />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">Acciones rápidas</p>
          <p className="mt-1 text-xs font-medium leading-5 text-blue-700">
            Usa este panel para trabajar con la instalación seleccionada sin
            perder la lista.
          </p>
        </div>

        <div className="grid gap-2">
          <Link
            href={`/installations/${installation.installation_id}`}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver detalle completo
          </Link>

          <Link
            href={`/installations/${installation.installation_id}/edit`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Editar instalación
          </Link>

          <Link
            href={`/follow-ups/new?installation_id=${installation.installation_id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            Crear mantenimiento
          </Link>

          {installation.client && (
            <Link
              href={
                installation.client.client_id
                  ? `/clients/${installation.client.client_id}`
                  : `/clients?search=${encodeURIComponent(clientName)}`
              }
              className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Ver cliente
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

