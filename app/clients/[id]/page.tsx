"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFullName } from "@/lib/utils/getFullName";
import {
  getClientStatusBadgeClass,
  getClientStatusLabel,
  type ClientStatus,
} from "@/lib/clients/clientStatus";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";
import { SummaryCard } from "@/components/clients/detail/SummaryCard";
import { CommercialSummaryCard } from "@/components/clients/detail/CommercialSummaryCard";
import { InfoRow } from "@/components/clients/detail/InfoRow";
import { MiniInfoCard } from "@/components/clients/detail/MiniInfoCard";

type ClientType = "PERSON" | "COMPANY" | "OTHER";
type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

type ClientFollowUp = {
  follow_up_id: string;
  target_date: string;
  reason?: string | null;
  priority?: number | null;
  estimated_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  follow_up_status?: {
    code?: string | null;
    name?: string | null;
  } | null;
};

type ClientInstallation = {
  installation_id: string;
  description?: string | null;
  installation_date?: string | null;
  installation_status?: string | null;
  estimated_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  address_line?: string | null;
  city?: string | null;
  zone?: string | null;
  is_active?: boolean | null;
  service_type?: {
    name?: string | null;
  } | null;
  follow_ups?: ClientFollowUp[];
};

type CommercialItem = {
  id: string;
  type: "INSTALLATION" | "FOLLOW_UP";
  description: string;
  date?: string | null;
  estimatedAmount: number;
  costAmount: number;
  billingStatus?: string | null;
};

type ClientActivityLog = {
  activity_id: string;
  client_id: string;
  entity_type: string;
  entity_id: string;
  category: string;
  action: string;
  visibility: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  title: string;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
};

type ActivityLogsResponse = {
  success: boolean;
  data: ClientActivityLog[];
  message?: string;
};

type DetailSectionKey =
  | "commercial"
  | "main"
  | "identification"
  | "business"
  | "location"
  | "finance"
  | "billing"
  | "installations"
  | "history";

type ClientDetail = {
  client_id: string;

  client_type?: ClientType | null;
  compliance_profile?: ClientComplianceProfile | null;
  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;

  identification_country?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;

  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
  phone_primary: string;
  phone_secondary?: string | null;
  email?: string | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  client_status?: ClientStatus | string | null;
  whatsapp_opt_in?: boolean | null;

  default_payment_term?: "CASH" | "CREDIT" | null;
  default_credit_days?: number | string | null;
  default_discount_rate?: number | string | null;
  credit_limit?: number | string | null;
  billing_same_as_client?: boolean | null;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  tax_exempt?: boolean | null;
  preferred_currency?: "CRC" | "USD" | null;

  installations?: ClientInstallation[];
};

function getClientDisplayName(client: ClientDetail) {
  return client.display_name || getFullName(client);
}

function getClientTypeLabel(type?: string | null) {
  if (type === "PERSON") return "Persona física";
  if (type === "COMPANY") return "Empresa / Persona jurídica";
  if (type === "OTHER") return "Otro";

  return "Persona física";
}

function getComplianceProfileLabel(profile?: string | null) {
  if (profile === "GLOBAL") return "Global";
  if (profile === "COSTA_RICA") return "Costa Rica";

  return "Costa Rica";
}

function getIdentificationTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    CEDULA_FISICA: "Cédula física",
    CEDULA_JURIDICA: "Cédula jurídica",
    DIMEX: "DIMEX",
    NITE: "NITE",
    EXTRANJERO_NO_DOMICILIADO: "Extranjero no domiciliado",
    NO_CONTRIBUYENTE: "No contribuyente",
    NATIONAL_ID: "Documento nacional",
    TAX_ID: "Documento fiscal",
    PASSPORT: "Pasaporte",
    BUSINESS_REGISTRATION: "Registro empresarial",
    OTHER: "Otro",
  };

  return type ? (labels[type] ?? type) : "-";
}

function getPaymentTermLabel(term?: string | null) {
  if (term === "CREDIT") return "Crédito";
  if (term === "CASH") return "Contado";

  return "Contado";
}

function formatYesNo(value?: boolean | null) {
  return value ? "Sí" : "No";
}

function formatPercentage(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "-";

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return String(value);

  return `${parsed}%`;
}

function formatOptionalNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "-";

  return String(value);
}

function getWhatsAppBadgeClass(enabled?: boolean | null) {
  return enabled
    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border border-slate-200 bg-slate-100 text-slate-700";
}

function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

function formatDateLabel(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toSafeNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value?: number | string | null) {
  const amount = toSafeNumber(value);

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getBillingStatusLabel(status?: string | null) {
  if (status === "PENDING") return "Pendiente";
  if (status === "INVOICED") return "Facturado";
  if (status === "PARTIALLY_PAID") return "Parcial";
  if (status === "PAID") return "Pagado";
  if (status === "NOT_BILLABLE") return "No facturable";
  if (status === "BILLING_ERROR") return "Error";
  if (status === "CANCELLED") return "Cancelado";

  return status || "Sin estado";
}

function getBillingStatusClass(status?: string | null) {
  if (status === "PAID") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "INVOICED" || status === "PARTIALLY_PAID") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "BILLING_ERROR" || status === "CANCELLED") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (status === "NOT_BILLABLE") {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

function getInstallationStatusClass(status?: string | null) {
  if (status === "CLOSED") {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  if (status === "IN_PROGRESS") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "CANCELLED") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  return "border border-blue-200 bg-blue-50 text-blue-700";
}

function getInstallationStatusLabel(status?: string | null) {
  if (status === "OPEN") return "Abierta";
  if (status === "IN_PROGRESS") return "En proceso";
  if (status === "CLOSED") return "Cerrada";
  if (status === "CANCELLED") return "Cancelada";
  return status || "Sin estado";
}

function getInstallationActiveBadgeClass(isActive?: boolean | null) {
  return isActive === false
    ? "border border-slate-200 bg-slate-100 text-slate-700"
    : "border border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getInstallationActiveLabel(isActive?: boolean | null) {
  return isActive === false ? "Inactiva" : "Activa";
}

function getNextPendingFollowUp(installation?: ClientInstallation | null) {
  if (!installation?.follow_ups?.length) return null;

  const now = new Date();

  return installation.follow_ups.find((item) => {
    if (item.follow_up_status?.code === "completed") return false;
    return new Date(item.target_date).getTime() >= now.getTime();
  });
}

function getActivityCategoryLabel(category: string) {
  if (category === "CLIENT") return "Cliente";
  if (category === "INSTALLATION") return "Instalación";
  if (category === "FOLLOW_UP") return "Mantenimiento";
  if (category === "CONTACT") return "Contacto";
  if (category === "FILE") return "Archivo";
  if (category === "FINANCE") return "Finanzas";
  if (category === "SYSTEM") return "Sistema";

  return category;
}

function getActivityActionLabel(action: string) {
  if (action === "CREATED") return "Creado";
  if (action === "UPDATED") return "Actualizado";
  if (action === "DELETED") return "Eliminado";
  if (action === "STATUS_CHANGED") return "Estado actualizado";
  if (action === "NOTE_ADDED") return "Nota agregada";
  if (action === "FILE_ADDED") return "Archivo agregado";
  if (action === "FILE_REMOVED") return "Archivo removido";
  if (action === "CONTACT_REGISTERED") return "Contacto registrado";
  if (action === "CONTACT_MESSAGE_SENT") return "Mensaje enviado";
  if (action === "INVOICE_CREATED") return "Factura creada";
  if (action === "INVOICE_UPDATED") return "Factura actualizada";
  if (action === "PAYMENT_REGISTERED") return "Pago registrado";
  if (action === "SYSTEM_EVENT") return "Evento del sistema";

  return action;
}

function getActivityCategoryClass(category: string) {
  if (category === "CLIENT") {
    return "border border-slate-200 bg-slate-50 text-slate-700";
  }

  if (category === "INSTALLATION") {
    return "border border-violet-200 bg-violet-50 text-violet-700";
  }

  if (category === "FOLLOW_UP") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }

  if (category === "CONTACT") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (category === "FILE") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (category === "FINANCE") {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getActivityFieldLabel(fieldName?: string | null) {
  if (!fieldName) return "Evento general";

  const labels: Record<string, string> = {
    target_date: "Fecha objetivo",
    due_date: "Fecha límite",
    scheduled_date: "Fecha programada",
    completed_at: "Fecha de finalización",
    reason: "Descripción",
    priority: "Prioridad",
    notes: "Notas",
    maintenance_type: "Tipo de mantenimiento",
    technician_id: "Técnico asignado",
    follow_up_status_id: "Estado",
    estimated_amount: "Monto estimado",
    final_amount: "Monto final",
    cost_amount: "Costo",
    billing_status: "Estado de facturación",
    billing_notes: "Notas de facturación",
    billing_block_reason: "Motivo de bloqueo de facturación",
    description: "Descripción",
    installation_status: "Estado de instalación",
    installation_date: "Fecha de instalación",
    address_line: "Dirección",
    phone_primary: "Teléfono principal",
    phone_secondary: "Teléfono secundario",
    email: "Correo electrónico",
    whatsapp_opt_in: "WhatsApp",
    client_status: "Estado del cliente",
    client_type: "Tipo de cliente",
    compliance_profile: "Perfil de validación",
    display_name: "Nombre visible",
    legal_name: "Nombre legal",
    company_name: "Nombre de empresa",
    commercial_name: "Nombre comercial",
    main_contact_name: "Contacto principal",
    identification_country: "País de identificación",
    identification_type: "Tipo de identificación",
    identification_number: "Número de identificación",
    default_payment_term: "Condición de pago",
    default_credit_days: "Días de crédito",
    default_discount_rate: "Descuento predeterminado",
    credit_limit: "Límite de crédito",
    billing_same_as_client: "Usar datos del cliente para facturación",
    billing_name: "Nombre de facturación",
    billing_email: "Correo de facturación",
    billing_phone: "Teléfono de facturación",
    billing_address: "Dirección de facturación",
    tax_id: "Identificación tributaria",
    tax_exempt: "Exento de IVA",
    preferred_currency: "Moneda preferida",
  };

  return labels[fieldName] ?? fieldName;
}

function formatActivityValue(value?: string | null, fieldName?: string | null) {
  if (!value) return "—";

  if (fieldName === "client_status") {
    return getClientStatusLabel(value);
  }

  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime()) && value.includes("T")) {
    return formatDateLabel(value);
  }

  return value;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activityLogs, setActivityLogs] = useState<ClientActivityLog[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(true);
  const [activityLogsError, setActivityLogsError] = useState("");

  const [installationSearch, setInstallationSearch] = useState("");
  const [installationFilter, setInstallationFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [openSections, setOpenSections] = useState<
    Record<DetailSectionKey, boolean>
  >({
    commercial: true,
    main: true,
    identification: true,
    business: false,
    location: true,
    finance: false,
    billing: false,
    installations: true,
    history: false,
  });

  function toggleDetailSection(section: DetailSectionKey) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  async function loadActivityLogs() {
    if (!id) {
      setActivityLogs([]);
      setActivityLogsLoading(false);
      return;
    }

    try {
      setActivityLogsLoading(true);
      setActivityLogsError("");

      const activityRes = await fetch(
        `/api/activity-logs?client_id=${id}&take=100`,
        {
          cache: "no-store",
        },
      );

      const activityResult: ActivityLogsResponse = await activityRes.json();

      if (!activityRes.ok || !activityResult.success) {
        throw new Error(
          activityResult.message || "Failed to load activity logs",
        );
      }

      setActivityLogs(activityResult.data ?? []);
    } catch {
      setActivityLogsError("No se pudo cargar el historial del cliente");
    } finally {
      setActivityLogsLoading(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setError("Cliente no encontrado");
        setLoading(false);
        return;
      }

      try {
        const clientRes = await fetch(`/api/clients/${id}`, {
          cache: "no-store",
        });

        const clientResult = await clientRes.json();

        if (!clientRes.ok || !clientResult.success) {
          throw new Error(clientResult.message || "Failed to load client");
        }

        setClient(clientResult.data);
      } catch {
        setError("No se pudo cargar el cliente");
      } finally {
        setLoading(false);
      }
    }

    loadData();
    void loadActivityLogs();
  }, [id]);

  const installations = useMemo(() => {
    return client?.installations || [];
  }, [client]);

  const commercialSummary = useMemo(() => {
    const items: CommercialItem[] = installations.flatMap((installation) => {
      const installationItem: CommercialItem = {
        id: installation.installation_id,
        type: "INSTALLATION",
        description: installation.description || "Instalación",
        date: installation.installation_date,
        estimatedAmount: toSafeNumber(installation.estimated_amount),
        costAmount: toSafeNumber(installation.cost_amount),
        billingStatus: installation.billing_status,
      };

      const followUpItems: CommercialItem[] = (
        installation.follow_ups || []
      ).map((followUp) => ({
        id: followUp.follow_up_id,
        type: "FOLLOW_UP",
        description: followUp.reason || "Mantenimiento",
        date: followUp.target_date,
        estimatedAmount: toSafeNumber(followUp.estimated_amount),
        costAmount: toSafeNumber(followUp.cost_amount),
        billingStatus: followUp.billing_status,
      }));

      return [installationItem, ...followUpItems];
    });

    const billableItems = items.filter(
      (item) =>
        item.billingStatus !== "NOT_BILLABLE" &&
        item.billingStatus !== "CANCELLED",
    );

    const totalEstimated = billableItems.reduce(
      (total, item) => total + item.estimatedAmount,
      0,
    );

    const totalCost = billableItems.reduce(
      (total, item) => total + item.costAmount,
      0,
    );

    const pendingAmount = billableItems
      .filter((item) => !item.billingStatus || item.billingStatus === "PENDING")
      .reduce((total, item) => total + item.estimatedAmount, 0);

    const invoicedAmount = billableItems
      .filter(
        (item) =>
          item.billingStatus === "INVOICED" ||
          item.billingStatus === "PARTIALLY_PAID",
      )
      .reduce((total, item) => total + item.estimatedAmount, 0);

    const paidAmount = billableItems
      .filter((item) => item.billingStatus === "PAID")
      .reduce((total, item) => total + item.estimatedAmount, 0);

    return {
      items,
      recentItems: [...items]
        .filter((item) => item.estimatedAmount > 0 || item.costAmount > 0)
        .sort((a, b) => {
          const aDate = a.date ? new Date(a.date).getTime() : 0;
          const bDate = b.date ? new Date(b.date).getTime() : 0;

          return bDate - aDate;
        })
        .slice(0, 6),
      totalEstimated,
      totalCost,
      pendingAmount,
      invoicedAmount,
      paidAmount,
      profitAmount: totalEstimated - totalCost,
    };
  }, [installations]);

  const filteredInstallations = useMemo(() => {
    const term = installationSearch.trim().toLowerCase();

    return [...installations]
      .filter((item) => {
        const description = item.description?.toLowerCase() || "";
        const serviceType = item.service_type?.name?.toLowerCase() || "";
        const city = item.city?.toLowerCase() || "";
        const zone = item.zone?.toLowerCase() || "";
        const address = item.address_line?.toLowerCase() || "";
        const status = item.installation_status?.toLowerCase() || "";

        const matchesSearch =
          !term ||
          description.includes(term) ||
          serviceType.includes(term) ||
          city.includes(term) ||
          zone.includes(term) ||
          address.includes(term) ||
          status.includes(term);

        const matchesFilter =
          installationFilter === "all"
            ? true
            : installationFilter === "active"
              ? item.is_active !== false
              : item.is_active === false;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const aDate = a.installation_date
          ? new Date(a.installation_date).getTime()
          : 0;
        const bDate = b.installation_date
          ? new Date(b.installation_date).getTime()
          : 0;

        return bDate - aDate;
      });
  }, [installations, installationSearch, installationFilter]);

  const totalMaintenances = useMemo(() => {
    return installations.reduce((total, installation) => {
      return total + (installation.follow_ups?.length || 0);
    }, 0);
  }, [installations]);

  const completedMaintenancesCount = useMemo(() => {
    return installations.reduce((total, installation) => {
      const completedCount =
        installation.follow_ups?.filter(
          (item) => item.follow_up_status?.code === "completed",
        ).length || 0;

      return total + completedCount;
    }, 0);
  }, [installations]);

  const nextMaintenance = useMemo(() => {
    const pendingItems = installations
      .flatMap((installation) =>
        (installation.follow_ups || [])
          .filter((item) => item.follow_up_status?.code !== "completed")
          .map((item) => ({
            ...item,
            installation,
          })),
      )
      .filter((item) => new Date(item.target_date).getTime() >= Date.now())
      .sort(
        (a, b) =>
          new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
      );

    return pendingItems[0] || null;
  }, [installations]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Cargando cliente...
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (error || !client) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-red-600">
              {error || "Cliente no encontrado"}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Perfil del cliente
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  {getClientDisplayName(client)}
                </h1>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getClientStatusBadgeClass(
                    client.client_status,
                  )}`}
                >
                  {getClientStatusLabel(client.client_status)}
                </span>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getWhatsAppBadgeClass(
                    client.whatsapp_opt_in,
                  )}`}
                >
                  {client.whatsapp_opt_in
                    ? "WhatsApp habilitado"
                    : "Sin WhatsApp"}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                <span className="font-semibold text-slate-700">
                  ID interno:
                </span>{" "}
                {client.client_id}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push(`/clients/${client.client_id}/edit`)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Editar
            </button>

            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Instalaciones"
            value={String(installations.length)}
            helper="Total registradas"
          />
          <SummaryCard
            label="Mantenimientos"
            value={String(totalMaintenances)}
            helper="Total asociados"
          />
          <SummaryCard
            label="Completados"
            value={String(completedMaintenancesCount)}
            helper="Historial cerrado"
          />
          <SummaryCard
            label="Próximo"
            value={
              nextMaintenance
                ? formatDateLabel(nextMaintenance.target_date)
                : "-"
            }
            helper={
              nextMaintenance
                ? nextMaintenance.installation?.description ||
                  nextMaintenance.reason ||
                  "Mantenimiento programado"
                : "Sin próximos mantenimientos"
            }
          />
        </section>

        <CollapsibleCard
          title="Resumen comercial"
          rightContent={
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {commercialSummary.items.length} trabajo
              {commercialSummary.items.length === 1 ? "" : "s"}
            </div>
          }
          isOpen={openSections.commercial}
          onToggle={() => toggleDetailSection("commercial")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <CommercialSummaryCard
              label="Total vendido"
              value={formatCurrency(commercialSummary.totalEstimated)}
              helper="Instalaciones y mantenimientos"
            />
            <CommercialSummaryCard
              label="Pendiente"
              value={formatCurrency(commercialSummary.pendingAmount)}
              helper="Pendiente por facturar"
            />
            <CommercialSummaryCard
              label="Facturado"
              value={formatCurrency(commercialSummary.invoicedAmount)}
              helper="Facturado o parcial"
            />
            <CommercialSummaryCard
              label="Pagado"
              value={formatCurrency(commercialSummary.paidAmount)}
              helper="Trabajos pagados"
            />
            <CommercialSummaryCard
              label="Costo interno"
              value={formatCurrency(commercialSummary.totalCost)}
              helper="Costo registrado"
            />
            <CommercialSummaryCard
              label="Utilidad estimada"
              value={formatCurrency(commercialSummary.profitAmount)}
              helper="Venta menos costo"
            />
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                Trabajos recientes
              </h3>
            </div>

            {commercialSummary.recentItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Aún no hay montos comerciales registrados para este cliente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {commercialSummary.recentItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {item.type === "INSTALLATION"
                              ? "Instalación"
                              : "Mantenimiento"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getBillingStatusClass(
                              item.billingStatus,
                            )}`}
                          >
                            {getBillingStatusLabel(item.billingStatus)}
                          </span>
                        </div>

                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.description}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Fecha: {formatDateLabel(item.date)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                        <MiniInfoCard
                          label="Monto"
                          value={formatCurrency(item.estimatedAmount)}
                        />
                        <MiniInfoCard
                          label="Costo"
                          value={formatCurrency(item.costAmount)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Información principal"
          isOpen={openSections.main}
          onToggle={() => toggleDetailSection("main")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow
              label="Tipo de cliente"
              value={getClientTypeLabel(client.client_type)}
            />
            <InfoRow
              label="Nombre visible"
              value={client.display_name || getClientDisplayName(client)}
            />
            <InfoRow label="Nombre" value={client.first_name || "-"} />
            <InfoRow
              label="Primer apellido"
              value={client.last_name_1 || "-"}
            />
            <InfoRow
              label="Segundo apellido"
              value={client.last_name_2 || "-"}
            />
            <InfoRow
              label="Estado"
              value={getClientStatusLabel(client.client_status)}
            />
            <InfoRow label="Teléfono principal" value={client.phone_primary} />
            <InfoRow
              label="Teléfono secundario"
              value={client.phone_secondary || "-"}
            />
            <InfoRow label="Email" value={client.email || "-"} />
            <InfoRow
              label="WhatsApp"
              value={formatYesNo(client.whatsapp_opt_in)}
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Identificación y cumplimiento"
          isOpen={openSections.identification}
          onToggle={() => toggleDetailSection("identification")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow
              label="Perfil de validación"
              value={getComplianceProfileLabel(client.compliance_profile)}
            />
            <InfoRow
              label="País de identificación"
              value={client.identification_country || "CR"}
            />
            <InfoRow
              label="Tipo de identificación"
              value={getIdentificationTypeLabel(client.identification_type)}
            />
            <InfoRow
              label="Número de identificación"
              value={client.identification_number || client.tax_id || "-"}
            />
            <InfoRow
              label="Identificación tributaria"
              value={client.tax_id || client.identification_number || "-"}
            />
            <InfoRow
              label="Exento de IVA"
              value={formatYesNo(client.tax_exempt)}
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Datos empresariales"
          isOpen={openSections.business}
          onToggle={() => toggleDetailSection("business")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow
              label="Razón social / nombre legal"
              value={client.legal_name || "-"}
            />
            <InfoRow
              label="Nombre de empresa"
              value={client.company_name || "-"}
            />
            <InfoRow
              label="Nombre comercial"
              value={client.commercial_name || "-"}
            />
            <InfoRow
              label="Contacto principal"
              value={client.main_contact_name || "-"}
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Ubicación"
          isOpen={openSections.location}
          onToggle={() => toggleDetailSection("location")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Provincia" value={client.admin_level_1 || "-"} />
            <InfoRow label="Cantón" value={client.admin_level_2 || "-"} />
            <InfoRow label="Distrito" value={client.admin_level_3 || "-"} />
            <div className="sm:col-span-2">
              <InfoRow label="Dirección" value={client.address_line || "-"} />
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Configuración financiera"
          isOpen={openSections.finance}
          onToggle={() => toggleDetailSection("finance")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow
              label="Tipo de pago"
              value={getPaymentTermLabel(client.default_payment_term)}
            />
            <InfoRow
              label="Días de crédito"
              value={formatOptionalNumber(client.default_credit_days)}
            />
            <InfoRow
              label="Límite de crédito"
              value={formatCurrency(client.credit_limit)}
            />
            <InfoRow
              label="Descuento por defecto"
              value={formatPercentage(client.default_discount_rate)}
            />
            <InfoRow
              label="Moneda preferida"
              value={client.preferred_currency || "CRC"}
            />
            <InfoRow
              label="Exento de IVA"
              value={formatYesNo(client.tax_exempt)}
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Datos de facturación"
          isOpen={openSections.billing}
          onToggle={() => toggleDetailSection("billing")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow
              label="Usa datos del cliente"
              value={formatYesNo(client.billing_same_as_client)}
            />
            <InfoRow
              label="Nombre de facturación"
              value={client.billing_name || "-"}
            />
            <InfoRow
              label="Email de facturación"
              value={client.billing_email || "-"}
            />
            <InfoRow
              label="Teléfono de facturación"
              value={client.billing_phone || "-"}
            />
            <div className="sm:col-span-2">
              <InfoRow
                label="Dirección de facturación"
                value={client.billing_address || "-"}
              />
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Instalaciones"
          rightContent={
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredInstallations.length} resultado
              {filteredInstallations.length === 1 ? "" : "s"}
            </div>
          }
          isOpen={openSections.installations}
          onToggle={() => toggleDetailSection("installations")}
        >
          <div className="mb-5 space-y-4">
            <input
              value={installationSearch}
              onChange={(e) => setInstallationSearch(e.target.value)}
              placeholder="Buscar por descripción, servicio, ubicación o estado..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInstallationFilter("all")}
                className={getFilterButtonClass(installationFilter === "all")}
              >
                Todas
              </button>

              <button
                type="button"
                onClick={() => setInstallationFilter("active")}
                className={getFilterButtonClass(
                  installationFilter === "active",
                )}
              >
                Activas
              </button>

              <button
                type="button"
                onClick={() => setInstallationFilter("inactive")}
                className={getFilterButtonClass(
                  installationFilter === "inactive",
                )}
              >
                Inactivas
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Mostrando {filteredInstallations.length} instalación
              {filteredInstallations.length === 1 ? "" : "es"}
            </p>
          </div>

          {filteredInstallations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No se encontraron instalaciones con los filtros actuales.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInstallations.map((item) => {
                const nextPendingFollowUp = getNextPendingFollowUp(item);
                const totalFollowUps = item.follow_ups?.length || 0;
                const completedFollowUps =
                  item.follow_ups?.filter(
                    (followUp) =>
                      followUp.follow_up_status?.code === "completed",
                  ).length || 0;

                return (
                  <div
                    key={item.installation_id}
                    onClick={() =>
                      router.push(`/installations/${item.installation_id}`)
                    }
                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold tracking-tight text-slate-900">
                            {item.description || "Instalación"}
                          </p>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInstallationStatusClass(
                              item.installation_status,
                            )}`}
                          >
                            {getInstallationStatusLabel(
                              item.installation_status,
                            )}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInstallationActiveBadgeClass(
                              item.is_active,
                            )}`}
                          >
                            {getInstallationActiveLabel(item.is_active)}
                          </span>

                          {item.billing_status && (
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBillingStatusClass(
                                item.billing_status,
                              )}`}
                            >
                              {getBillingStatusLabel(item.billing_status)}
                            </span>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <MiniInfoCard
                            label="Servicio"
                            value={item.service_type?.name || "-"}
                          />

                          <MiniInfoCard
                            label="Fecha de instalación"
                            value={formatDateLabel(item.installation_date)}
                          />

                          <MiniInfoCard
                            label="Monto"
                            value={formatCurrency(item.estimated_amount)}
                          />

                          <MiniInfoCard
                            label="Costo"
                            value={formatCurrency(item.cost_amount)}
                          />

                          <MiniInfoCard
                            label="Ubicación"
                            value={
                              item.city
                                ? `${item.city}${item.zone ? ` · ${item.zone}` : ""}`
                                : item.zone || item.address_line || "-"
                            }
                          />

                          <MiniInfoCard
                            label="Mantenimientos"
                            value={String(totalFollowUps)}
                          />

                          <MiniInfoCard
                            label="Completados"
                            value={String(completedFollowUps)}
                          />

                          <MiniInfoCard
                            label="Próximo mantenimiento"
                            value={
                              nextPendingFollowUp
                                ? formatDateLabel(
                                    nextPendingFollowUp.target_date,
                                  )
                                : "-"
                            }
                          />

                          <MiniInfoCard
                            label="Motivo próximo"
                            value={
                              nextPendingFollowUp?.reason ||
                              "Sin mantenimiento pendiente"
                            }
                          />

                          <MiniInfoCard
                            label="Dirección"
                            value={item.address_line || "-"}
                          />
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left lg:min-w-[150px] lg:text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            Ver detalle
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            Instalación
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleCard>

        <CollapsibleCard
          title="Historial del cliente"
          rightContent={
            <button
              type="button"
              onClick={() => void loadActivityLogs()}
              disabled={activityLogsLoading}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refrescar
            </button>
          }
          isOpen={openSections.history}
          onToggle={() => toggleDetailSection("history")}
        >
          <ClientActivityHistory
            activityLogs={activityLogs}
            loading={activityLogsLoading}
            error={activityLogsError}
          />
        </CollapsibleCard>
      </div>
    </main>
  );
}

function ClientActivityHistory({
  activityLogs,
  loading,
  error,
}: {
  activityLogs: ClientActivityLog[];
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm text-slate-500">
          Cargando historial del cliente...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    );
  }

  if (activityLogs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
        <p className="text-sm font-medium text-slate-500">
          Aún no hay eventos registrados para este cliente.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Los cambios de clientes, instalaciones, mantenimientos, archivos,
          contactos y finanzas aparecerán aquí automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activityLogs.map((activity) => (
        <div
          key={activity.activity_id}
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getActivityCategoryClass(
                    activity.category,
                  )}`}
                >
                  {getActivityCategoryLabel(activity.category)}
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {getActivityActionLabel(activity.action)}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-900">
                {activity.title}
              </p>

              {activity.description && (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {activity.description}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
              {formatDateTimeLabel(activity.created_at)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <MiniInfoCard
              label="Módulo"
              value={getActivityCategoryLabel(activity.category)}
            />

            <MiniInfoCard
              label="Campo"
              value={getActivityFieldLabel(activity.field_name)}
            />

            <MiniInfoCard
              label="Usuario"
              value={activity.created_by || "Sistema"}
            />
          </div>

          {(activity.old_value || activity.new_value) && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Antes
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {formatActivityValue(activity.old_value, activity.field_name)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Después
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {formatActivityValue(activity.new_value, activity.field_name)}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
