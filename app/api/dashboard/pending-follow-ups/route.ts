import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FilterType = "all" | "overdue" | "today" | "upcoming";

function getZoneLabel(
  installation: {
    zone?: string | null;
    city?: string | null;
    address_line?: string | null;
  } | null,
) {
  if (!installation) return "Zona no definida";

  const zone = installation.zone?.trim() || "";
  const city = installation.city?.trim() || "";
  const address = installation.address_line?.trim() || "";

  if (zone && city) return `${zone} - ${city}`;
  if (zone) return zone;
  if (city) return city;
  if (address) return address;

  return "Zona no definida";
}

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = normalizeFilter(searchParams.get("filter"));

    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const next7Days = new Date(startOfToday);
    next7Days.setDate(next7Days.getDate() + 7);

    const pendingStatus = await prisma.followUpStatus.findFirst({
      where: {
        code: "pending",
      },
    });

    if (!pendingStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "Pending status not found",
        },
        { status: 500 },
      );
    }

    const followUps = await prisma.followUp.findMany({
      where: {
        follow_up_status_id: pendingStatus.follow_up_status_id,
      },
      include: {
        client: true,
        installation: true,
        follow_up_status: true,
      },
      orderBy: {
        target_date: "asc",
      },
    });

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
      const zone = getZoneLabel(item.installation);

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
            new Date(a.target_date).getTime() -
            new Date(b.target_date).getTime(),
        ),
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error("GET /api/dashboard/follow-ups-by-zone error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load follow-ups by zone",
        data: [],
      },
      { status: 500 },
    );
  }
}
