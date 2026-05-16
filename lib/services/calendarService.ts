import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getClientFullName(client: {
  first_name: string;
  last_name_1: string;
}) {
  return `${client.first_name} ${client.last_name_1}`.trim();
}

export async function getCalendarEventsService() {
  const today = new Date();

  const followUps = await prisma.followUp.findMany({
    select: {
      follow_up_id: true,
      target_date: true,
      scheduled_date: true,
      completed_at: true,
      reason: true,
      priority: true,
      billing_status: true,
      client: {
        select: {
          first_name: true,
          last_name_1: true,
        },
      },
      follow_up_status: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      target_date: "asc",
    },
  });

  const installations = await prisma.installation.findMany({
    select: {
      installation_id: true,
      installation_date: true,
      description: true,
      billing_status: true,
      client: {
        select: {
          first_name: true,
          last_name_1: true,
        },
      },
    },
    orderBy: {
      installation_date: "asc",
    },
  });

  const followUpEvents = followUps
    .filter((followUp) => {
      return followUp.follow_up_status.code !== "completed";
    })
    .map((followUp) => {
      const eventDate = followUp.scheduled_date || followUp.target_date;

      let type: "overdue" | "today" | "upcoming" | "confirmed" | "completed" =
        "upcoming";

      const formattedEventDate = formatDate(eventDate);
      const formattedToday = formatDate(today);

      if (followUp.completed_at) {
        type = "completed";
      } else if (followUp.scheduled_date) {
        type = "confirmed";
      } else if (formattedEventDate < formattedToday) {
        type = "overdue";
      } else if (formattedEventDate === formattedToday) {
        type = "today";
      }

      const clientName = getClientFullName(followUp.client);

      return {
        id: followUp.follow_up_id,
        entity_type: "follow_up",
        follow_up_id: followUp.follow_up_id,
        date: formattedEventDate,
        type,
        title:
          type === "confirmed"
            ? `✅ Mantenimiento confirmado - ${clientName}`
            : `Mantenimiento - ${clientName}`,
        description: followUp.reason || "Mantenimiento programado.",
        status: followUp.follow_up_status.name,
        priority: followUp.priority,
        billing_status: followUp.billing_status,
        is_confirmed: Boolean(followUp.scheduled_date),
        is_completed: Boolean(followUp.completed_at),
      };
    });

  const installationEvents = installations.map((installation) => {
    const clientName = getClientFullName(installation.client);

    return {
      id: installation.installation_id,
      entity_type: "installation",
      installation_id: installation.installation_id,
      date: formatDate(installation.installation_date),
      type: "installation" as const,
      title: `Instalación - ${clientName}`,
      description: installation.description || "Instalación registrada.",
      billing_status: installation.billing_status,
    };
  });

  return [...followUpEvents, ...installationEvents];
}
