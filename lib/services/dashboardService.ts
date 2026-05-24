import {
  findPendingFollowUpStatus,
  findPendingFollowUpsWithClientAndInstallation,
} from "@/lib/repositories/dashboardRepository";

import { getOperationalLocationLabel } from "@/lib/operational-location/operationalLocation.utils";

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

function getDateRanges() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const next7Days = new Date(startOfToday);
  next7Days.setDate(next7Days.getDate() + 7);

  return {
    startOfToday,
    endOfToday,
    next7Days,
  };
}

function shouldIncludeFollowUpByFilter(
  targetDate: Date,
  filter: FilterType,
  dateRanges: ReturnType<typeof getDateRanges>,
) {
  if (filter === "overdue") {
    return targetDate < dateRanges.startOfToday;
  }

  if (filter === "today") {
    return (
      targetDate >= dateRanges.startOfToday &&
      targetDate <= dateRanges.endOfToday
    );
  }

  if (filter === "upcoming") {
    return (
      targetDate > dateRanges.endOfToday && targetDate <= dateRanges.next7Days
    );
  }

  return true;
}

export async function getFollowUpsByZoneService(filterValue: string | null) {
  const filter = normalizeFilter(filterValue);
  const dateRanges = getDateRanges();

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

  const filtered = followUps.filter((item) =>
    shouldIncludeFollowUpByFilter(
      new Date(item.target_date),
      filter,
      dateRanges,
    ),
  );

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
    const zone = getOperationalLocationLabel({
      installation: item.installation,
      client: item.client,
    });

    if (!groupedMap.has(zone)) {
      groupedMap.set(zone, []);
    }

    groupedMap.get(zone)?.push({
      id: item.follow_up_id,
      target_date: item.target_date,
      priority: item.priority,
      status: item.follow_up_status?.name || "Pendiente",
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
