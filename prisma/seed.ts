import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedFollowUpStatuses() {
  console.log("➡ Seeding FollowUpStatus...");

  const items = [
    { code: "pending", name: "Pending" },
    { code: "contacted", name: "Contacted" },
    { code: "no_response", name: "No Response" },
    { code: "postponed", name: "Postponed" },
    { code: "completed", name: "Completed" },
    { code: "cancelled", name: "Cancelled" },
  ];

  for (const item of items) {
    await prisma.followUpStatus.upsert({
      where: { code: item.code },
      update: { name: item.name, is_active: true },
      create: item,
    });
  }

  console.log("✅ FollowUpStatus done");
}

async function seedContactChannels() {
  console.log("➡ Seeding ContactChannel...");

  const items = [
    { code: "call", name: "Call" },
    { code: "whatsapp", name: "WhatsApp" },
    { code: "visit", name: "Visit" },
    { code: "sms", name: "SMS" },
    { code: "other", name: "Other" },
  ];

  for (const item of items) {
    await prisma.contactChannel.upsert({
      where: { code: item.code },
      update: { name: item.name, is_active: true },
      create: item,
    });
  }

  console.log("✅ ContactChannel done");
}

async function seedContactResults() {
  console.log("➡ Seeding ContactResult...");

  const items = [
    { code: "contacted", name: "Contacted" },
    { code: "no_answer", name: "No Answer" },
    { code: "rescheduled", name: "Rescheduled" },
    { code: "interested", name: "Interested" },
    { code: "not_interested", name: "Not Interested" },
    { code: "pending_follow_up", name: "Pending Follow Up" },
  ];

  for (const item of items) {
    await prisma.contactResult.upsert({
      where: { code: item.code },
      update: { name: item.name, is_active: true },
      create: item,
    });
  }

  console.log("✅ ContactResult done");
}

async function seedServiceTypes() {
  console.log("➡ Seeding ServiceType...");

  const items = [
    { code: "installation", name: "Installation" },
    { code: "maintenance", name: "Maintenance" },
    { code: "repair", name: "Repair" },
    { code: "inspection", name: "Inspection" },
  ];

  for (const item of items) {
    await prisma.serviceType.upsert({
      where: { code: item.code },
      update: { name: item.name, is_active: true },
      create: item,
    });
  }

  console.log("✅ ServiceType done");
}

async function seedUsers() {
  console.log("➡ Seeding Users...");

  const items = [
    {
      email: "juan.tecnico@example.com",
      first_name: "Juan",
      last_name_1: "Rojas",
      last_name_2: "Mora",
      phone: "8888-1111",
      role: "TECHNICIAN" as const,
      is_active: true,
    },
    {
      email: "pedro.tecnico@example.com",
      first_name: "Pedro",
      last_name_1: "Vargas",
      last_name_2: "Soto",
      phone: "8888-2222",
      role: "TECHNICIAN" as const,
      is_active: true,
    },
    {
      email: "laura.supervisor@example.com",
      first_name: "Laura",
      last_name_1: "Jimenez",
      last_name_2: "Cruz",
      phone: "8888-3333",
      role: "SUPERVISOR" as const,
      is_active: true,
    },
    {
      email: "maria.admin@example.com",
      first_name: "Maria",
      last_name_1: "Fernandez",
      last_name_2: "Lopez",
      phone: "8888-4444",
      role: "ADMINISTRATION" as const,
      is_active: true,
    },
    {
      email: "admin@example.com",
      first_name: "Carlos",
      last_name_1: "Quesada",
      last_name_2: null,
      phone: "8888-5555",
      role: "ADMIN" as const,
      is_active: true,
    },
  ];

  for (const item of items) {
    await prisma.user.upsert({
      where: { email: item.email },
      update: {
        first_name: item.first_name,
        last_name_1: item.last_name_1,
        last_name_2: item.last_name_2,
        phone: item.phone,
        role: item.role,
        is_active: item.is_active,
      },
      create: item,
    });
  }

  console.log("✅ Users done");
}

async function main() {
  console.log("🌱 Seeding database...");

  await seedFollowUpStatuses();
  await seedContactChannels();
  await seedContactResults();
  await seedServiceTypes();
  await seedUsers();

  console.log("🎉 Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
