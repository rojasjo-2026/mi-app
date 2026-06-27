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

function getClientDisplayName(client: Client) {
  return (
    client.display_name?.trim() ||
    client.commercial_name?.trim() ||
    client.company_name?.trim() ||
    getClientFullName(client)
  );
}

function getClientSubtitle(client: Client) {
  if (client.client_type === "COMPANY") {
    return (
      client.main_contact_name?.trim() || client.legal_name?.trim() || "Empresa"
    );
  }

  if (client.client_type === "PERSON") {
    return "Persona";
  }

  return "Cliente";
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}

function getIdentificationLabel(client: Client) {
  const identificationNumber =
    client.identification_number?.trim() || client.tax_id?.trim();

  if (!identificationNumber) {
    return "-";
  }

  if (client.identification_type) {
    return `${client.identification_type} · ${identificationNumber}`;
  }

  return identificationNumber;
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
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        title={String(value)}
        className="mt-1 truncate text-lg font-semibold leading-none text-slate-950"
      >
        {value}
      </p>

      {helper ? (
        <p className="mt-1 truncate text-xs font-medium text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function QuickActions({
  client,
  isInactive,
  onToggleStatus,
}: {
  client: Client;
  isInactive: boolean;
  onToggleStatus: (client: Client) => void | Promise<void>;
}) {
  return (
    <section className="border-t border-slate-200 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-800">
        Acciones rápidas
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/clients/${client.client_id}`}
          className="inline-flex items-center justify-center rounded-md bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Ver detalle
        </Link>

        <Link
          href={`/clients/${client.client_id}/edit`}
          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Editar
        </Link>

        <Link
          href={`/installations/new?client_id=${client.client_id}`}
          className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Crear instalación
        </Link>

        <button
          type="button"
          onClick={() => void onToggleStatus(client)}
          className={[
            "inline-flex items-center justify-center rounded-md border px-3 py-2.5 text-sm font-semibold transition",
            isInactive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-red-200 bg-white text-red-600 hover:bg-red-50",
          ].join(" ")}
        >
          {isInactive ? "Activar" : "Desactivar"}
        </button>
      </div>
    </section>
  );
}

export function ClientPreviewPanel({
  client,
  onToggleStatus,
}: ClientPreviewPanelProps) {
  if (!client) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
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

  const displayName = getClientDisplayName(client);
  const subtitle = getClientSubtitle(client);
  const initials = getInitials(displayName);
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
    <aside className="sticky top-6 z-10 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Cliente seleccionado
            </p>

            <h2
              title={displayName}
              className="mt-1 truncate text-base font-semibold tracking-tight text-slate-950"
            >
              {displayName}
            </h2>

            <p
              title={subtitle}
              className="mt-1 truncate text-xs font-medium text-slate-500"
            >
              {subtitle}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {getClientStatusLabel(status)}
              </span>

              {client.country_code ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {client.country_code}
                </span>
              ) : null}

              {client.preferred_currency ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {client.preferred_currency}
                </span>
              ) : null}

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

      <QuickActions
        client={client}
        isInactive={isInactive}
        onToggleStatus={onToggleStatus}
      />

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

            <DetailField
              label="Identificación"
              value={getIdentificationLabel(client)}
            />

            <DetailField
              label="Moneda"
              value={client.preferred_currency || "-"}
            />
          </div>
        </section>

        <ClientActivityPreview clientId={client.client_id} />
      </div>
    </aside>
  );
}
