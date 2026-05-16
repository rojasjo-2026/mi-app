import { prisma } from "@/lib/prisma";
import { InstallationComponentStatus } from "@prisma/client";
import { toNumberOrFallback } from "../utils/number.utils";
import { toTrimmedStringOrFallback } from "../utils/string.utils";

type CreateComponentInput = {
  name?: string;
  quantity?: number | string;
  unit?: string;
  category?: string;
  brand?: string;
  model?: string;
  status?: string;
  technical_notes?: string;
};

function parseComponentStatus(
  value: string | undefined | null,
  fallback: InstallationComponentStatus,
): InstallationComponentStatus {
  if (value === "OPERATIVE") return InstallationComponentStatus.OPERATIVE;
  if (value === "REVIEW_REQUIRED")
    return InstallationComponentStatus.REVIEW_REQUIRED;
  if (value === "REPLACEMENT_SUGGESTED")
    return InstallationComponentStatus.REPLACEMENT_SUGGESTED;

  return fallback;
}

export async function getComponentsByInstallationService(
  installation_id: string,
) {
  return prisma.installationComponent.findMany({
    where: { installation_id },
    orderBy: { created_at: "desc" },
  });
}

export async function createComponentService(
  installation_id: string,
  body: CreateComponentInput,
) {
  if (!body.name || body.name.trim() === "") {
    return {
      success: false,
      errors: [{ field: "name", error: "required" }],
    };
  }

  const quantity = toNumberOrFallback(body.quantity, 1);

  if (quantity === null) {
    return {
      success: false,
      errors: [{ field: "quantity", error: "invalid" }],
    };
  }

  const component = await prisma.installationComponent.create({
    data: {
      installation_id,
      name: body.name.trim(),
      quantity,
      unit: toTrimmedStringOrFallback(body.unit, null),
      category: toTrimmedStringOrFallback(body.category, null),
      brand: toTrimmedStringOrFallback(body.brand, null),
      model: toTrimmedStringOrFallback(body.model, null),
      status: parseComponentStatus(
        body.status,
        InstallationComponentStatus.OPERATIVE,
      ),
      technical_notes: toTrimmedStringOrFallback(body.technical_notes, null),
    },
  });

  return { success: true, component };
}

export async function updateComponentService(
  component_id: string,
  body: Partial<CreateComponentInput>,
) {
  const existing = await prisma.installationComponent.findUnique({
    where: { component_id },
  });

  if (!existing) return null;

  const updated = await prisma.installationComponent.update({
    where: { component_id },
    data: {
      name: body.name?.trim() ?? existing.name,
      quantity:
        toNumberOrFallback(body.quantity, Number(existing.quantity)) ??
        existing.quantity,
      unit: toTrimmedStringOrFallback(body.unit, existing.unit),
      category: toTrimmedStringOrFallback(body.category, existing.category),
      brand: toTrimmedStringOrFallback(body.brand, existing.brand),
      model: toTrimmedStringOrFallback(body.model, existing.model),
      status: parseComponentStatus(body.status, existing.status),
      technical_notes: toTrimmedStringOrFallback(
        body.technical_notes,
        existing.technical_notes,
      ),
    },
  });

  return { success: true, component: updated };
}

export async function deleteComponentService(component_id: string) {
  const existing = await prisma.installationComponent.findUnique({
    where: { component_id },
  });

  if (!existing) return null;

  await prisma.installationComponent.delete({
    where: { component_id },
  });

  return { success: true };
}
