import Link from "next/link";
import {
  normalizeClientStatus,
  getClientStatusLabel,
} from "@/lib/clients/clientStatus";
import {
  getClientFullName,
  getLocationLabel,
  formatDateLabel,
} from "@/lib/clients/clientList.utils";
import type { Client } from "../config/clientsPageConfig";
import { getWhatsAppWebUrl } from "../utils/clientsPageUtils";
import { ClientActivityPreview } from "./ClientActivityPreview";
import { DetailField } from "./DetailField";

type ClientPreviewPanelProps = {
  client: Client | null;
  onToggleStatus: (client: Client) => void | Promise<void>;
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}

function OperationalStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        title={String(value)}
        className="mt-1 truncate text-lg font-semibold leading-none text-slate-950"
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

export function ClientPreviewPanel({
  client,
  onToggleStatus,
}: ClientPreviewPanelProps) {
  if (!client) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-semibold text-slate-800">
          Resumen del cliente
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona un cliente de la tabla para ver su información y acciones
          rápidas.
        </p>
      </aside>
    );
  }

  const fullName = getClientFullName(client);
  const initials = getInitials(fullName);
  const location = getLocationLabel(client) || "Sin ubicación";
  const status = normalizeClientStatus(client.client_status) ?? "ACTIVE";

  const installationCount =
    typeof client.installation_count === "number"
      ? client.installation_count
      : 0;

  const maintenanceCount =
    typeof client.maintenance_count === "number" ? client.maintenance_count : 0;

  const pendingMaintenanceCount =
    typeof client.pending_maintenance_count === "number"
      ? client.pending_maintenance_count
      : 0;

  const pendingInvoiceCount =
    typeof client.pending_invoice_count === "number"
      ? client.pending_invoice_count
      : 0;

  const lastMaintenance = formatDateLabel(client.last_maintenance) || "-";
  const lastContact = formatDateLabel(client.last_contact) || "Sin registro";
  const whatsappUrl = getWhatsAppWebUrl(client.phone_primary);
  const isInactive = status === "INACTIVE";

  return (
    <aside className="sticky top-6 z-10 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Cliente seleccionado
            </p>

            <h2
              title={fullName}
              className="mt-1 truncate text-base font-semibold tracking-tight text-slate-950"
            >
              {fullName}
            </h2>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {getClientStatusLabel(status)}
              </span>

              <span
                className={[
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  client.whatsapp_opt_in
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {client.whatsapp_opt_in
                  ? "WhatsApp habilitado"
                  : "Sin WhatsApp"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Situación operativa
          </p>

          <div className="grid grid-cols-2 gap-2">
            <OperationalStat
              label="Instalaciones"
              value={installationCount}
              helper="Activas"
            />

            <OperationalStat
              label="Mant. pendientes"
              value={pendingMaintenanceCount}
              helper={`${maintenanceCount} total`}
            />

            <OperationalStat
              label="Facturas pendientes"
              value={pendingInvoiceCount}
              helper="Por gestionar"
            />

            <OperationalStat
              label="Última visita"
              value={lastMaintenance}
              helper="Mantenimiento"
            />
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Información principal
          </p>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <DetailField label="Teléfono" value={client.phone_primary || "-"} />

            <DetailField label="WhatsApp">
              {whatsappUrl && client.whatsapp_opt_in ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir chat en WhatsApp Web con este cliente"
                  className="inline-flex max-w-full items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 hover:text-green-800"
                >
                  Abrir chat
                </a>
              ) : (
                <span className="text-slate-500">No habilitado</span>
              )}
            </DetailField>

            <DetailField label="Ubicación" value={location} />

            <DetailField label="Último contacto" value={lastContact} />
          </div>
        </section>

        <ClientActivityPreview clientId={client.client_id} />

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Acciones rápidas
          </p>

          <div className="grid gap-2">
            <Link
              href={`/clients/${client.client_id}`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ver detalle completo
            </Link>

            <Link
              href={`/clients/${client.client_id}/edit`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Editar cliente
            </Link>

            <Link
              href={`/installations/new?client_id=${client.client_id}`}
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Crear instalación
            </Link>

            <button
              type="button"
              onClick={() => void onToggleStatus(client)}
              className={[
                "inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition",
                isInactive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-red-200 bg-white text-red-600 hover:bg-red-50",
              ].join(" ")}
            >
              {isInactive ? "Activar cliente" : "Desactivar cliente"}
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
