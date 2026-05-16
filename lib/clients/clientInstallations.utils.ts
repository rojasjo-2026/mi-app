import type {
  ClientFollowUp,
  ClientInstallation,
  InstallationFilter,
} from "@/lib/clients/clientDetail.types";

export type ClientNextMaintenance = ClientFollowUp & {
  installation: ClientInstallation;
};

export function filterClientInstallations(
  installations: ClientInstallation[] = [],
  installationSearch: string,
  installationFilter: InstallationFilter,
) {
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
}

export function countClientMaintenances(
  installations: ClientInstallation[] = [],
) {
  return installations.reduce((total, installation) => {
    return total + (installation.follow_ups?.length || 0);
  }, 0);
}

export function countCompletedClientMaintenances(
  installations: ClientInstallation[] = [],
) {
  return installations.reduce((total, installation) => {
    const completedCount =
      installation.follow_ups?.filter(
        (item) => item.follow_up_status?.code === "completed",
      ).length || 0;

    return total + completedCount;
  }, 0);
}

export function getNextClientMaintenance(
  installations: ClientInstallation[] = [],
): ClientNextMaintenance | null {
  const pendingItems: ClientNextMaintenance[] = installations
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
}
