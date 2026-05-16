import type { WorkBillingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const followUpInclude = {
  client: true,
  installation: true,
  follow_up_status: true,
  technician: true,
};

const followUpDetailInclude = {
  client: true,
  installation: true,
  follow_up_status: true,
  technician: true,
  contact_attempts: {
    orderBy: {
      attempt_datetime: "desc" as const,
    },
  },
};

export type CreateFollowUpData = {
  client_id: string;
  installation_id: string | null;
  follow_up_status_id: number;
  target_date: Date;
  due_date: Date | null;
  reason: string | null;
  priority: number;
  notes: string | null;
  created_from: string;

  estimated_amount?: number | null;
  final_amount?: number | null;
  cost_amount?: number | null;
  billing_status?: WorkBillingStatus;
  billing_notes?: string | null;
  maintenance_type?: string | null;
  technician_id?: string | null;
};

export type UpdateFollowUpData = Partial<{
  target_date: Date;
  due_date: Date | null;
  reason: string | null;
  priority: number;
  notes: string | null;

  estimated_amount: number | null;
  final_amount: number | null;
  cost_amount: number | null;
  billing_status: WorkBillingStatus;
  billing_notes: string | null;
  maintenance_type: string | null;
  technician_id: string | null;
}>;

export type FindFollowUpsParams = {
  client_id?: string;
  installation_id?: string;
  status?: string;
  priority?: number;
};

export async function findClientById(id: string) {
  return prisma.client.findUnique({
    where: {
      client_id: id,
    },
    select: {
      client_id: true,
    },
  });
}

export async function findInstallationById(id: string) {
  return prisma.installation.findUnique({
    where: {
      installation_id: id,
    },
    select: {
      installation_id: true,
      client_id: true,
    },
  });
}

export async function findInstallationWithClientById(id: string) {
  return prisma.installation.findUnique({
    where: {
      installation_id: id,
    },
    include: {
      client: true,
    },
  });
}

export async function findPendingFollowUpStatus() {
  return prisma.followUpStatus.findUnique({
    where: {
      code: "pending",
    },
  });
}

export async function findCompletedFollowUpStatus() {
  return prisma.followUpStatus.findUnique({
    where: {
      code: "completed",
    },
  });
}

export async function findActiveCompletedFollowUpStatus() {
  return prisma.followUpStatus.findFirst({
    where: {
      OR: [
        { code: "completed" },
        { code: "COMPLETED" },
        { name: "Completed" },
        { name: "completed" },
      ],
      is_active: true,
    },
  });
}

export async function findConfirmedFollowUpStatus() {
  return prisma.followUpStatus.findFirst({
    where: {
      OR: [
        { code: "confirmed" },
        { code: "CONFIRMED" },
        { name: "Confirmed" },
        { name: "confirmed" },
        { name: "Confirmado" },
        { name: "confirmado" },
      ],
      is_active: true,
    },
  });
}

export async function findPostponedFollowUpStatus() {
  return prisma.followUpStatus.findUnique({
    where: {
      code: "postponed",
    },
  });
}

export async function findFollowUpById(id: string) {
  return prisma.followUp.findUnique({
    where: {
      follow_up_id: id,
    },
    include: followUpDetailInclude,
  });
}

export async function createFollowUp(data: CreateFollowUpData) {
  return prisma.followUp.create({
    data,
    include: followUpInclude,
  });
}

export async function completeFollowUp(
  id: string,
  follow_up_status_id: number,
) {
  return prisma.followUp.update({
    where: {
      follow_up_id: id,
    },
    data: {
      follow_up_status_id,
      completed_at: new Date(),
    },
    include: followUpDetailInclude,
  });
}

export async function confirmFollowUp(
  id: string,
  data: {
    follow_up_status_id: number;
    scheduled_date: Date;
  },
) {
  return prisma.followUp.update({
    where: {
      follow_up_id: id,
    },
    data: {
      follow_up_status_id: data.follow_up_status_id,
      scheduled_date: data.scheduled_date,
    },
    include: followUpDetailInclude,
  });
}

export async function postponeFollowUp(
  id: string,
  data: {
    target_date: Date;
    due_date: Date | null;
    follow_up_status_id: number;
  },
) {
  return prisma.followUp.update({
    where: {
      follow_up_id: id,
    },
    data,
    include: followUpDetailInclude,
  });
}

export async function updateFollowUp(id: string, data: UpdateFollowUpData) {
  return prisma.followUp.update({
    where: {
      follow_up_id: id,
    },
    data,
    include: followUpDetailInclude,
  });
}

export async function findFollowUps(params: FindFollowUpsParams) {
  const { client_id, installation_id, status, priority } = params;

  return prisma.followUp.findMany({
    where: {
      ...(client_id ? { client_id } : {}),
      ...(installation_id ? { installation_id } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(status
        ? {
            follow_up_status: {
              code: status,
            },
          }
        : {}),
    },
    include: followUpInclude,
    orderBy: [{ target_date: "asc" }, { created_at: "desc" }],
  });
}

export async function createMaintenanceContactFlowForFollowUp(data: {
  follow_up_id: string;
  client_id: string;
  installation_id: string | null;
  trigger_date: Date;
  contact_phone?: string | null;
}) {
  return prisma.maintenanceContactFlow.create({
    data: {
      follow_up_id: data.follow_up_id,
      client_id: data.client_id,
      installation_id: data.installation_id,
      trigger_date: data.trigger_date,
      contact_phone: data.contact_phone ?? null,
      status: "PENDING",
    },
  });
}
