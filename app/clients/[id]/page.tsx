"use client";

import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAppSettings } from "@/app/hooks/useAppSettings";
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
import { getBusinessCountryPreset } from "@/lib/settings/appSettingsUtils";
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

function formatInstallationHistoryDate(value?: string | null, locale = "es") {
  if (!value) return "";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getInstallationHistoryLabel(
  installation: InstallationHistoryOption,
  locale?: string,
) {
  const description =
    installation.description?.trim() || "Instalación sin descripción";

  const date = formatInstallationHistoryDate(
    installation.installation_date,
    locale,
  );

  const location = [installation.city, installation.zone]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");

  return [description, date, location].filter(Boolean).join(" · ");
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { businessCountryMeta } = useAppSettings();

  const clientId = typeof params?.id === "string" ? params.id : undefined;

  const [selectedHistoryInstallationId, setSelectedHistoryInstallationId] =
    useState("all");

  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState("ALL");

  const { client, loading, error } = useClientDetail(clientId);

  const clientCountryPreset = useMemo(() => {
    return getBusinessCountryPreset(
      client?.country_code ??
        client?.identification_country ??
        businessCountryMeta.countryCode,
    );
  }, [
    businessCountryMeta.countryCode,
    client?.country_code,
    client?.identification_country,
  ]);

  const clientCurrency =
    client?.preferred_currency || clientCountryPreset.primaryCurrency;

  const clientLocale = clientCountryPreset.locale || businessCountryMeta.locale;

  const activityLogFilters = {
    ...(selectedHistoryInstallationId !== "all"
      ? {
          entityType: "INSTALLATION",
          entityId: selectedHistoryInstallationId,
        }
      : {}),
    ...(selectedHistoryCategory !== "ALL"
      ? {
          category: selectedHistoryCategory,
        }
      : {}),
  };

  const {
    activityLogs,
    activityLogsLoading,
    activityLogsError,
    activityLogsPage,
    reloadActivityLogs,
    goToPreviousActivityLogsPage,
    goToNextActivityLogsPage,
    hasPreviousActivityLogsPage,
    hasNextActivityLogsPage,
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
    identification: false,
    business: false,
    location: true,
    finance: false,
    billing: false,
    installations: true,
    history: true,
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
      <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
        <div className="mx-auto w-full max-w-[1500px]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
      <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
        <div className="mx-auto w-full max-w-[1500px]">
          <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-red-600">
              {error || "Cliente no encontrado"}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-4">
        <ClientDetailHeader
          client={client}
          installationsCount={installations.length}
          onEdit={() => router.push(`/clients/${client.client_id}/edit`)}
          onBack={() => router.push("/clients")}
          onCreateInstallation={() =>
            router.push(`/installations/new?client_id=${client.client_id}`)
          }
          onScheduleMaintenance={() =>
            router.push(`/follow-ups/new?client_id=${client.client_id}`)
          }
        />

        <ClientDetailSummaryCards
          installationsCount={installations.length}
          totalMaintenances={totalMaintenances}
          pendingBalance={invoiceFinanceSummary.pendingBalance}
          pendingInvoiceCount={invoiceFinanceSummary.pendingInvoiceCount}
          nextMaintenance={nextMaintenance}
          currency={clientCurrency}
          locale={clientLocale}
        />

        <ClientCommercialSection
          commercialSummary={commercialSummary}
          isOpen={openSections.commercial}
          onToggle={() => toggleDetailSection("commercial")}
          currency={clientCurrency}
          locale={clientLocale}
        />

        <ClientFinanceHistorySection
          invoices={invoices}
          summary={invoiceFinanceSummary}
          loading={invoicesLoading}
          error={invoicesError}
          isOpen={openSections.financeHistory}
          onToggle={() => toggleDetailSection("financeHistory")}
          onRefresh={() => void reloadInvoices()}
          currency={clientCurrency}
          locale={clientLocale}
        />

        <ClientInformationSections
          client={client}
          openSections={openSections}
          onToggle={toggleDetailSection}
        />

        <ClientInstallationsSection
          filteredInstallations={filteredInstallations}
          totalInstallationsCount={installations.length}
          installationSearch={installationSearch}
          installationFilter={installationFilter}
          isOpen={openSections.installations}
          onToggle={() => toggleDetailSection("installations")}
          onSearchChange={setInstallationSearch}
          onFilterChange={setInstallationFilter}
          onInstallationClick={(installationId) =>
            router.push(`/installations/${installationId}`)
          }
          onCreateInstallation={() =>
            router.push(`/installations/new?client_id=${client.client_id}`)
          }
          currency={clientCurrency}
          locale={clientLocale}
        />

        <CollapsibleCard
          title="Historial del cliente"
          description="Actividad y eventos relacionados con este cliente."
          icon={<History className="h-4 w-4" />}
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
                className="h-8 min-w-[240px] rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 outline-none transition hover:bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Historial completo del cliente</option>

                {installations.map((installation) => (
                  <option
                    key={installation.installation_id}
                    value={installation.installation_id}
                  >
                    {getInstallationHistoryLabel(installation, clientLocale)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void reloadActivityLogs()}
                disabled={activityLogsLoading}
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            selectedCategory={selectedHistoryCategory}
            currentPage={activityLogsPage}
            hasPreviousPage={hasPreviousActivityLogsPage}
            hasNextPage={hasNextActivityLogsPage}
            onCategoryChange={setSelectedHistoryCategory}
            onPreviousPage={goToPreviousActivityLogsPage}
            onNextPage={goToNextActivityLogsPage}
            locale={clientLocale}
          />
        </CollapsibleCard>
      </div>
    </main>
  );
}
