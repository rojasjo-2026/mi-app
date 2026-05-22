"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  DetailSectionKey,
  InstallationFilter,
} from "@/lib/clients/clientDetail.types";
import { buildClientCommercialSummary } from "@/lib/clients/clientCommercialSummary";
import { buildClientInvoiceFinanceSummary } from "@/lib/clients/clientInvoiceFinanceSummary";
import {
  countClientMaintenances,
  filterClientInstallations,
  getNextClientMaintenance,
} from "@/lib/clients/clientInstallations.utils";
import { useClientActivityLogs } from "@/hooks/clients/useClientActivityLogs";
import { useClientDetail } from "@/hooks/clients/useClientDetail";
import { useClientInvoices } from "@/hooks/clients/useClientInvoices";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";
import { ClientActivityHistory } from "@/components/clients/detail/ClientActivityHistory";
import { ClientCommercialSection } from "@/components/clients/detail/ClientCommercialSection";
import { ClientDetailHeader } from "@/components/clients/detail/ClientDetailHeader";
import { ClientDetailSummaryCards } from "@/components/clients/detail/ClientDetailSummaryCards";
import { ClientFinanceHistorySection } from "@/components/clients/detail/ClientFinanceHistorySection";
import { ClientInformationSections } from "@/components/clients/detail/ClientInformationSections";
import { ClientInstallationsSection } from "@/components/clients/detail/ClientInstallationsSection";

type InstallationHistoryOption = {
  installation_id?: string | null;
  description?: string | null;
  installation_date?: string | null;
  city?: string | null;
  zone?: string | null;
};

function formatInstallationHistoryDate(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getInstallationHistoryLabel(installation: InstallationHistoryOption) {
  const description =
    installation.description?.trim() || "Instalación sin descripción";

  const date = formatInstallationHistoryDate(installation.installation_date);

  const location = [installation.city, installation.zone]
    .filter(Boolean)
    .join(" · ");

  return [description, date, location].filter(Boolean).join(" · ");
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();

  const clientId = typeof params?.id === "string" ? params.id : undefined;

  const [selectedHistoryInstallationId, setSelectedHistoryInstallationId] =
    useState("all");

  const { client, loading, error } = useClientDetail(clientId);

  const activityLogFilters =
    selectedHistoryInstallationId !== "all"
      ? {
          entityType: "INSTALLATION",
          entityId: selectedHistoryInstallationId,
        }
      : {};

  const {
    activityLogs,
    activityLogsLoading,
    activityLogsError,
    reloadActivityLogs,
    loadMoreActivityLogs,
    hasMore: hasMoreActivityLogs,
  } = useClientActivityLogs(clientId, activityLogFilters);

  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    reloadInvoices,
  } = useClientInvoices(clientId);

  const [installationSearch, setInstallationSearch] = useState("");
  const [installationFilter, setInstallationFilter] =
    useState<InstallationFilter>("all");

  const [openSections, setOpenSections] = useState<
    Record<DetailSectionKey, boolean>
  >({
    commercial: true,
    financeHistory: true,
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

  const installations = useMemo(() => {
    return client?.installations || [];
  }, [client]);

  const commercialSummary = useMemo(() => {
    return buildClientCommercialSummary(installations);
  }, [installations]);

  const invoiceFinanceSummary = useMemo(() => {
    return buildClientInvoiceFinanceSummary(invoices);
  }, [invoices]);

  const filteredInstallations = useMemo(() => {
    return filterClientInstallations(
      installations,
      installationSearch,
      installationFilter,
    );
  }, [installations, installationSearch, installationFilter]);

  const totalMaintenances = useMemo(() => {
    return countClientMaintenances(installations);
  }, [installations]);

  const nextMaintenance = useMemo(() => {
    return getNextClientMaintenance(installations);
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
        <ClientDetailHeader
          client={client}
          onEdit={() => router.push(`/clients/${client.client_id}/edit`)}
          onBack={() => router.push("/clients")}
        />

        <ClientDetailSummaryCards
          installationsCount={installations.length}
          totalMaintenances={totalMaintenances}
          pendingBalance={invoiceFinanceSummary.pendingBalance}
          pendingInvoiceCount={invoiceFinanceSummary.pendingInvoiceCount}
          nextMaintenance={nextMaintenance}
        />

        <ClientCommercialSection
          commercialSummary={commercialSummary}
          isOpen={openSections.commercial}
          onToggle={() => toggleDetailSection("commercial")}
        />

        <ClientFinanceHistorySection
          invoices={invoices}
          summary={invoiceFinanceSummary}
          loading={invoicesLoading}
          error={invoicesError}
          isOpen={openSections.financeHistory}
          onToggle={() => toggleDetailSection("financeHistory")}
          onRefresh={() => void reloadInvoices()}
        />

        <ClientInformationSections
          client={client}
          openSections={openSections}
          onToggle={toggleDetailSection}
        />

        <ClientInstallationsSection
          filteredInstallations={filteredInstallations}
          installationSearch={installationSearch}
          installationFilter={installationFilter}
          isOpen={openSections.installations}
          onToggle={() => toggleDetailSection("installations")}
          onSearchChange={setInstallationSearch}
          onFilterChange={setInstallationFilter}
          onInstallationClick={(installationId) =>
            router.push(`/installations/${installationId}`)
          }
        />

        <CollapsibleCard
          title="Historial del cliente"
          rightContent={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="history-installation-filter">
                Filtrar historial por instalación
              </label>

              <select
                id="history-installation-filter"
                value={selectedHistoryInstallationId}
                onChange={(event) =>
                  setSelectedHistoryInstallationId(event.target.value)
                }
                disabled={activityLogsLoading || installations.length === 0}
                className="min-w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Historial completo del cliente</option>

                {installations.map((installation) => (
                  <option
                    key={installation.installation_id}
                    value={installation.installation_id}
                  >
                    {getInstallationHistoryLabel(installation)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void reloadActivityLogs()}
                disabled={activityLogsLoading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Refrescar
              </button>
            </div>
          }
          isOpen={openSections.history}
          onToggle={() => toggleDetailSection("history")}
        >
          <ClientActivityHistory
            activityLogs={activityLogs}
            loading={activityLogsLoading}
            error={activityLogsError}
            hasMore={hasMoreActivityLogs}
            onLoadMore={() => void loadMoreActivityLogs()}
          />
        </CollapsibleCard>
      </div>
    </main>
  );
}
