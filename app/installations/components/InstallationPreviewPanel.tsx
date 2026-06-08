import Link from "next/link";
import type { InstallationItem } from "../config/installationsPageConfig";
import { DetailField } from "./DetailField";
import {
  formatCurrency,
  formatDateLabel,
  getClientName,
  getInitials,
  getInstallationStatusLabel,
  getLocationLabel,
  getStatusBadgeClass,
} from "../utils/installationsPageUtils";

type InstallationPreviewPanelProps = {
  installation: InstallationItem | null;
  businessCurrency: string;
  businessLocale: string;
};

function OperationalStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        title={value}
        className="mt-1 truncate text-sm font-semibold text-slate-950"
      >
        {value}
      </p>

      {helper && (
        <p className="mt-1 truncate text-xs font-medium text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
}

export function InstallationPreviewPanel({
  installation,
  businessCurrency,
  businessLocale,
}: InstallationPreviewPanelProps) {
  if (!installation) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-semibold text-slate-800">
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
  const initials = getInitials(installationName);
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
    <aside className="sticky top-6 z-10 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Instalación seleccionada
            </p>

            <h2
              title={installationName}
              className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-slate-950"
            >
              {installationName}
            </h2>

            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
              >
                {statusLabel}
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {serviceName}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Acciones rápidas
          </p>

          <div className="grid gap-2">
            <Link
              href={`/installations/${installation.installation_id}`}
              className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ver detalle completo
            </Link>

            <Link
              href={`/installations/${installation.installation_id}/edit`}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Editar instalación
            </Link>

            <Link
              href={`/follow-ups/new?installation_id=${installation.installation_id}`}
              className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
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
                className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Ver cliente
              </Link>
            )}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Situación operativa
          </p>

          <div className="grid grid-cols-2 gap-2">
            <OperationalStat
              label="Fecha"
              value={installationDate}
              helper="Instalación"
            />

            <OperationalStat
              label="Técnico"
              value={technicianName}
              helper="Responsable"
            />

            <OperationalStat label="Monto" value={amount} helper="Estimado" />

            <OperationalStat
              label="Estado"
              value={statusLabel}
              helper="Actual"
            />
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Información principal
          </p>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <DetailField label="Cliente" value={clientName} />

            <DetailField
              label="Teléfono"
              value={installation.client?.phone_primary || "Sin teléfono"}
            />

            <DetailField label="Servicio" value={serviceName} />

            <DetailField label="Ubicación" value={location} />
          </div>
        </section>
      </div>
    </aside>
  );
}
