import { prisma } from "@/lib/prisma";

const contactAttemptInclude = {
  follow_up: true,
  client: true,
  contact_channel: true,
  contact_result: true,
};

export type CreateContactAttemptData = {
  follow_up_id: string;
  client_id: string;
  contact_channel_id: number;
  contact_result_id: number;
  attempt_datetime: Date;
  note_text: string | null;
  next_action: string | null;
  next_target_date: Date | null;
};

export async function findFollowUpById(id: string) {
  return prisma.followUp.findUnique({
    where: {
      follow_up_id: id,
    },
    select: {
      follow_up_id: true,
    },
  });
}

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

export async function findContactChannelById(id: number) {
  return prisma.contactChannel.findUnique({
    where: {
      contact_channel_id: id,
    },
    select: {
      contact_channel_id: true,
    },
  });
}

export async function findContactResultById(id: number) {
  return prisma.contactResult.findUnique({
    where: {
      contact_result_id: id,
    },
    select: {
      contact_result_id: true,
    },
  });
}

export async function createContactAttempt(data: CreateContactAttemptData) {
  return prisma.contactAttempt.create({
    data,
    include: contactAttemptInclude,
  });
}

export async function findContactAttemptsByFollowUpId(follow_up_id: string) {
  return prisma.contactAttempt.findMany({
    where: {
      follow_up_id,
    },
    include: contactAttemptInclude,
    orderBy: {
      attempt_datetime: "desc",
    },
  });
}
