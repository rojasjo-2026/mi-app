import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return 0;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function GET() {
  try {
    const today = startOfToday();
    const recentActivityFrom = daysAgo(7);

    const [
      totalClients,
      activeClients,
      activeInstallations,
      overdueMaintenances,
      scheduledMaintenances,
      completedFollowUps,
      completedInstallations,
      pendingBillingAggregate,
      unansweredClientGroups,
      recentActivityCount,
    ] = await Promise.all([
      prisma.client.count(),

      prisma.client.count({
        where: {
          client_status: "ACTIVE",
        },
      }),

      prisma.installation.count({
        where: {
          is_active: true,
          installation_status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      }),

      prisma.followUp.count({
        where: {
          completed_at: null,
          target_date: {
            lt: today,
          },
        },
      }),

      prisma.followUp.count({
        where: {
          completed_at: null,
          scheduled_date: {
            not: null,
          },
        },
      }),

      prisma.followUp.count({
        where: {
          completed_at: {
            not: null,
          },
        },
      }),

      prisma.installation.count({
        where: {
          installation_status: "CLOSED",
        },
      }),

      prisma.invoice.aggregate({
        where: {
          status: {
            in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
          },
        },
        _sum: {
          balance_amount: true,
        },
      }),

      prisma.maintenanceContactFlow.groupBy({
        by: ["client_id"],
        where: {
          status: {
            in: ["WAITING_RESPONSE", "NO_RESPONSE", "MANUAL_REQUIRED"],
          },
        },
      }),

      prisma.activityLog.count({
        where: {
          created_at: {
            gte: recentActivityFrom,
          },
        },
      }),
    ]);

    const pendingBilling = toNumber(
      pendingBillingAggregate._sum.balance_amount,
    );

    return NextResponse.json({
      totalClients,
      activeClients,
      activeInstallations,
      overdueMaintenances,
      scheduledMaintenances,
      completedWorks: completedFollowUps + completedInstallations,
      pendingBilling,
      unansweredClients: unansweredClientGroups.length,
      recentActivityCount,
      metadata: {
        generatedAt: new Date().toISOString(),
        recentActivityWindowDays: 7,
      },
    });
  } catch (error) {
    console.error("Error loading reports summary:", error);

    return NextResponse.json(
      {
        error: "Error loading reports summary",
      },
      { status: 500 },
    );
  }
}
