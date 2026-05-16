import {
  findPendingFollowUpStatus,
  findPendingFollowUpsWithClientAndInstallation,
} from "@/lib/repositories/dashboardRepository";

type FilterType = "all" | "overdue" | "today" | "upcoming";

function normalizeFilter(value: string | null): FilterType {
  if (
    value === "all" ||
    value === "overdue" ||
    value === "today" ||
    value === "upcoming"
  ) {
    return value;
  }

  return "all";
}

function getZoneLabel(
  installation: {
    zone?: string | null;
    city?: string | null;
    address_line?: string | null;
    latitude?: unknown;
    longitude?: unknown;
  } | null,
  client: {
    zone?: string | null;
    admin_level_1?: string | null;
    admin_level_2?: string | null;
    admin_level_3?: string | null;
    address_line?: string | null;
  } | null,
) {
  const installationZone = installation?.zone?.trim() || "";
  const installationCity = installation?.city?.trim() || "";
  const installationAddress = installation?.address_line?.trim() || "";

  if (installationZone && installationCity) {
    return `${installationZone} - ${installationCity}`;
  }

  if (installationZone) return installationZone;
  if (installationCity) return installationCity;
  if (installationAddress) return installationAddress;

  const clientZone = client?.zone?.trim() || "";
  const clientLevel1 = client?.admin_level_1?.trim() || "";
  const clientLevel2 = client?.admin_level_2?.trim() || "";
  const clientLevel3 = client?.admin_level_3?.trim() || "";
  const clientAddress = client?.address_line?.trim() || "";

  if (clientZone && clientLevel3) {
    return `${clientZone} - ${clientLevel3}`;
  }

  if (clientZone) return clientZone;
  if (clientLevel3) return clientLevel3;
  if (clientLevel2) return clientLevel2;
  if (clientLevel1) return clientLevel1;
  if (clientAddress) return clientAddress;

  if (installation?.latitude && installation?.longitude) {
    return "Ubicación GPS registrada";
  }

  return "Zona no definida";
}

export async function getFollowUpsByZoneService(filterValue: string | null) {
  const filter = normalizeFilter(filterValue);

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const next7Days = new Date(startOfToday);
  next7Days.setDate(next7Days.getDate() + 7);

  const pendingStatus = await findPendingFollowUpStatus();

  if (!pendingStatus) {
    return {
      success: false as const,
      code: "pending_status_not_found" as const,
    };
  }

  const followUps = await findPendingFollowUpsWithClientAndInstallation(
    pendingStatus.follow_up_status_id,
  );

  const filtered = followUps.filter((item) => {
    const targetDate = new Date(item.target_date);

    if (filter === "overdue") {
      return targetDate < startOfToday;
    }

    if (filter === "today") {
      return targetDate >= startOfToday && targetDate <= endOfToday;
    }

    if (filter === "upcoming") {
      return targetDate > endOfToday && targetDate <= next7Days;
    }

    return true;
  });

  const groupedMap = new Map<
    string,
    Array<{
      id: string;
      target_date: Date;
      priority: number;
      status: string;
      client: {
        id: string;
        first_name: string;
        last_name_1: string;
        last_name_2: string | null;
        phone_primary: string | null;
      } | null;
      installation: {
        id: string;
        address: string | null;
        latitude: unknown;
        longitude: unknown;
      } | null;
    }>
  >();

  for (const item of filtered) {
    const zone = getZoneLabel(item.installation, item.client);

    if (!groupedMap.has(zone)) {
      groupedMap.set(zone, []);
    }

    groupedMap.get(zone)?.push({
      id: item.follow_up_id,
      target_date: item.target_date,
      priority: item.priority,
      status: item.follow_up_status?.name || "Pending",
      client: item.client
        ? {
            id: item.client.client_id,
            first_name: item.client.first_name,
            last_name_1: item.client.last_name_1,
            last_name_2: item.client.last_name_2 || null,
            phone_primary: item.client.phone_primary || null,
          }
        : null,
      installation: item.installation
        ? {
            id: item.installation.installation_id,
            address: item.installation.address_line,
            latitude: item.installation.latitude,
            longitude: item.installation.longitude,
          }
        : null,
    });
  }

  const grouped = Array.from(groupedMap.entries())
    .map(([zone, items]) => ({
      zone,
      total: items.length,
      items: items.sort(
        (a, b) =>
          new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
      ),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    success: true as const,
    data: grouped,
  };
}
