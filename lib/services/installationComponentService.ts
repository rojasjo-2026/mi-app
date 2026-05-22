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

type ComponentActivityAction = "CREATED" | "UPDATED" | "DELETED";

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

async function recordInstallationComponentActivitySafely(params: {
  installationId?: string | null;
  componentName?: string | null;
  action: ComponentActivityAction;
}) {
  try {
    const installationId = String(params.installationId || "").trim();
    const componentName = String(params.componentName || "").trim();

    if (!installationId || !componentName) {
      return null;
    }

    const installation = await prisma.installation.findUnique({
      where: {
        installation_id: installationId,
      },
      select: {
        installation_id: true,
        client_id: true,
      },
    });

    if (!installation?.client_id) {
      return null;
    }

    const isCreated = params.action === "CREATED";
    const isUpdated = params.action === "UPDATED";
    const isDeleted = params.action === "DELETED";

    return prisma.activityLog.create({
      data: {
        client_id: installation.client_id,
        entity_type: "INSTALLATION",
        entity_id: installation.installation_id,
        category: "INSTALLATION",
        action: params.action,
        visibility: "PUBLIC_INTERNAL",
        field_name: "component",
        old_value: isDeleted ? componentName : null,
        new_value: isCreated || isUpdated ? componentName : null,
        title: isCreated
          ? "Componente agregado"
          : isUpdated
            ? "Componente actualizado"
            : "Componente eliminado",
        description: isCreated
          ? "Se agregó un componente a la instalación."
          : isUpdated
            ? "Se actualizó un componente de la instalación."
            : "Se eliminó un componente de la instalación.",
        created_by: "system",
      },
    });
  } catch (error) {
    console.error("Error recording installation component activity:", error);
    return null;
  }
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

  await recordInstallationComponentActivitySafely({
    installationId: installation_id,
    componentName: component.name,
    action: "CREATED",
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

  await recordInstallationComponentActivitySafely({
    installationId: updated.installation_id,
    componentName: updated.name,
    action: "UPDATED",
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

  await recordInstallationComponentActivitySafely({
    installationId: existing.installation_id,
    componentName: existing.name,
    action: "DELETED",
  });

  return { success: true };
}
