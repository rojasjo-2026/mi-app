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
import { DetailField } from "./DetailField";

export function ClientPreviewPanel({
  client,
  onToggleStatus,
}: {
  client: Client | null;
  onToggleStatus: (client: Client) => void | Promise<void>;
}) {
  if (!client) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-bold text-slate-800">Resumen del cliente</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona un cliente de la tabla para ver su información y acciones
          rápidas.
        </p>
      </aside>
    );
  }

  const fullName = getClientFullName(client);
  const location = getLocationLabel(client) || "Sin ubicación";
  const status = normalizeClientStatus(client.client_status) ?? "ACTIVE";
  const maintenanceCount =
    typeof client.maintenance_count === "number" ? client.maintenance_count : 0;
  const installationCount =
    typeof client.installation_count === "number"
      ? client.installation_count
      : 0;
  const lastActivity =
    formatDateLabel(client.last_contact) ||
    formatDateLabel(client.last_maintenance) ||
    "Sin registro";
  const whatsappUrl = getWhatsAppWebUrl(client.phone_primary);

  return (
    <aside className="sticky top-6 z-10 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Resumen del cliente
        </p>

        <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
          {fullName}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {getClientStatusLabel(status)}
          </span>

          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-bold",
              client.whatsapp_opt_in
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-500",
            ].join(" ")}
          >
            {client.whatsapp_opt_in ? "WhatsApp habilitado" : "Sin WhatsApp"}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <DetailField label="Teléfono" value={client.phone_primary || "-"} />
          <DetailField label="WhatsApp">
            {whatsappUrl && client.whatsapp_opt_in ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir chat en WhatsApp Web con este cliente"
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 transition hover:bg-green-100 hover:text-green-800"
              >
                Abrir WhatsApp
              </a>
            ) : (
              <span className="text-slate-500">No habilitado</span>
            )}
          </DetailField>
          <DetailField label="Ubicación" value={location} />
          <DetailField label="Última actividad" value={lastActivity} />
          <DetailField label="Instalaciones" value={installationCount} />
          <DetailField label="Mantenimientos" value={maintenanceCount} />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">Acciones rápidas</p>
          <p className="mt-1 text-xs font-medium leading-5 text-blue-700">
            Usa el panel para trabajar con el cliente seleccionado sin perder la
            lista.
          </p>
        </div>

        <div className="grid gap-2">
          <Link
            href={`/clients/${client.client_id}`}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver detalle completo
          </Link>

          <Link
            href={`/clients/${client.client_id}/edit`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Editar cliente
          </Link>

          <Link
            href={`/installations/new?client_id=${client.client_id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Crear instalación
          </Link>

          <button
            type="button"
            onClick={() => void onToggleStatus(client)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {status === "INACTIVE" ? "Activar cliente" : "Desactivar cliente"}
          </button>
        </div>
      </div>
    </aside>
  );
}

