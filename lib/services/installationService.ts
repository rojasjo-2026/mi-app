import { prisma } from "@/lib/prisma";
import {
  InstallationStatus,
  WorkBillingStatus,
  type ActivityLogAction,
  type ActivityLogCategory,
  type ActivityLogVisibility,
  type Prisma,
} from "@prisma/client";

import {
  createActivityLog,
  createManyActivityLogs,
} from "@/lib/repositories/activityLogRepository";
import {
  findInstallationById,
  updateInstallation,
  createInstallation,
  findInstallations,
  findClientById,
  findServiceTypeById,
  type UpdateInstallationData,
  type CreateInstallationData,
  type FindInstallationsParams,
} from "../repositories/installationRepository";
import { validateInstallationInput } from "../validators/installationValidator";
import { decimalToNumber, toNumberOrFallback } from "../utils/number.utils";
import { toDateOrFallback } from "../utils/date.utils";
import { toTrimmedStringOrFallback } from "../utils/string.utils";
import { getCoordinatesFromAddress } from "./geocodingService";

type UpdateInstallationInput = {
  client_id?: string;
  service_type_id?: number | string;
  installation_date?: string;
  description?: string | null;
  technical_observations?: string | null;
  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  cost_amount?: number | string | null;
  warranty_months?: number | string | null;
  warranty_end_date?: string | null;
  technician_name?: string | null;
  technician_id?: string | null;
  address_line?: string | null;
  zone?: string | null;
  city?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location_notes?: string | null;
  reference_point?: string | null;
  installation_status?: string;
  is_active?: boolean;
  billing_status?: string | null;
  billing_notes?: string | null;
  billing_block_reason?: string | null;
  changed_by?: string | null;
};

type CreateInstallationInput = {
  client_id?: string;
  service_type_id?: number | string;
  installation_date?: string;
  description?: string | null;
  technical_observations?: string | null;
  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  cost_amount?: number | string | null;
  warranty_months?: number | string | null;
  warranty_end_date?: string | null;
  technician_name?: string | null;
  technician_id?: string | null;
  address_line?: string | null;
  zone?: string | null;
  city?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location_notes?: string | null;
  reference_point?: string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  billing_block_reason?: string | null;
};

type ActivitySourceRecord = Record<string, unknown>;

type InstallationActivityField = {
  fieldName: string;
  title: string;
  description: string;
  category: ActivityLogCategory;
  visibility: ActivityLogVisibility;
  action: ActivityLogAction;
  getValue?: (source: ActivitySourceRecord | null) => unknown;
};

const INSTALLATION_ACTIVITY_FIELDS: InstallationActivityField[] = [
  {
    fieldName: "client_id",
    title: "Cliente de instalación actualizado",
    description: "Se actualizó el cliente asociado a la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "service_type_id",
    title: "Tipo de servicio actualizado",
    description: "Se actualizó el tipo de servicio de la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "installation_date",
    title: "Fecha de instalación actualizada",
    description: "Se actualizó la fecha de instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "description",
    title: "Descripción de instalación actualizada",
    description: "Se actualizó la descripción de la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "technical_observations",
    title: "Observaciones técnicas actualizadas",
    description:
      "Se actualizaron las observaciones técnicas de la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "estimated_amount",
    title: "Monto estimado de instalación actualizado",
    description: "Se actualizó el monto estimado de la instalación.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
    getValue: (source) =>
      source ? decimalToNumber(source.estimated_amount as never) : null,
  },
  {
    fieldName: "warranty_months",
    title: "Meses de garantía actualizados",
    description: "Se actualizaron los meses de garantía de la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "warranty_end_date",
    title: "Fecha final de garantía actualizada",
    description: "Se actualizó la fecha final de garantía de la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "technician_name",
    title: "Técnico de instalación actualizado",
    description: "Se actualizó el técnico asociado a la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "technician_id",
    title: "Usuario técnico actualizado",
    description: "Se actualizó el usuario técnico asociado a la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "installation_status",
    title: "Estado de instalación actualizado",
    description: "Se actualizó el estado de la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "STATUS_CHANGED",
  },
  {
    fieldName: "is_active",
    title: "Estado activo de instalación actualizado",
    description: "Se actualizó el estado activo de la instalación.",
    category: "INSTALLATION",
    visibility: "PUBLIC_INTERNAL",
    action: "STATUS_CHANGED",
  },
];

function stringifyChangeValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function valuesAreDifferent(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() !== b.getTime();
  }

  return a !== b;
}

function toActivityValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    const textValue = String(value).trim();
    return textValue || null;
  }

  if (typeof value === "object" && "toString" in value) {
    const textValue = String(value).trim();

    if (textValue && textValue !== "[object Object]") {
      return textValue;
    }
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeForActivityComparison(value: unknown) {
  return toActivityValue(value) ?? "";
}

function hasProvidedValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function parseNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseUpdateNumber(
  value: unknown,
  fallback: number | null,
): number | null {
  if (value === undefined) {
    return fallback;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function isInvalidProvidedNumber(value: unknown, parsedValue: number | null) {
  return hasProvidedValue(value) && parsedValue === null;
}

function toNullableStringOnUpdate(
  value: string | null | undefined,
  fallback: string | null,
) {
  if (value === undefined) {
    return fallback;
  }

  return toTrimmedStringOrFallback(value, null);
}

function toInstallationStatusOrFallback(
  value: unknown,
  fallback: InstallationStatus,
): InstallationStatus {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const normalizedValue = String(value).trim().toUpperCase();

  return Object.values(InstallationStatus).includes(
    normalizedValue as InstallationStatus,
  )
    ? (normalizedValue as InstallationStatus)
    : fallback;
}

function toWorkBillingStatusOrFallback(
  value: unknown,
  fallback: WorkBillingStatus,
): WorkBillingStatus {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const normalizedValue = String(value).trim().toUpperCase();

  return Object.values(WorkBillingStatus).includes(
    normalizedValue as WorkBillingStatus,
  )
    ? (normalizedValue as WorkBillingStatus)
    : fallback;
}

function getActivityFieldValue(
  source: ActivitySourceRecord | null,
  field: InstallationActivityField,
) {
  if (!source) return null;

  if (field.getValue) {
    return field.getValue(source);
  }

  return source[field.fieldName] ?? null;
}

async function recordInstallationCreatedActivitySafely(installation: unknown) {
  try {
    const record = installation as ActivitySourceRecord;

    const clientId = toActivityValue(record.client_id);
    const installationId = toActivityValue(record.installation_id);

    if (!clientId || !installationId) {
      return null;
    }

    return createActivityLog({
      client_id: clientId,
      entity_type: "INSTALLATION",
      entity_id: installationId,
      category: "INSTALLATION",
      action: "CREATED",
      visibility: "PUBLIC_INTERNAL",
      title: "Instalación creada",
      description: "Se creó una instalación para el cliente.",
      created_by: null,
    });
  } catch (error) {
    console.error("Error recording installation created activity:", error);
    return null;
  }
}

async function recordInstallationActivityChangesSafely(params: {
  before: unknown;
  after: unknown;
  changedBy?: string | null;
}) {
  try {
    const beforeRecord = params.before as ActivitySourceRecord | null;
    const afterRecord = params.after as ActivitySourceRecord | null;

    const clientId = toActivityValue(
      afterRecord?.client_id ?? beforeRecord?.client_id,
    );

    const installationId = toActivityValue(
      afterRecord?.installation_id ?? beforeRecord?.installation_id,
    );

    if (!clientId || !installationId) {
      return { count: 0 };
    }

    const logs: Prisma.ActivityLogCreateManyInput[] = [];

    for (const field of INSTALLATION_ACTIVITY_FIELDS) {
      const oldRawValue = getActivityFieldValue(beforeRecord, field);
      const newRawValue = getActivityFieldValue(afterRecord, field);

      if (
        normalizeForActivityComparison(oldRawValue) ===
        normalizeForActivityComparison(newRawValue)
      ) {
        continue;
      }

      logs.push({
        client_id: clientId,
        entity_type: "INSTALLATION",
        entity_id: installationId,
        category: field.category,
        action: field.action,
        visibility: field.visibility,
        field_name: field.fieldName,
        old_value: toActivityValue(oldRawValue),
        new_value: toActivityValue(newRawValue),
        title: field.title,
        description: field.description,
        created_by: params.changedBy ?? null,
      });
    }

    return createManyActivityLogs(logs);
  } catch (error) {
    console.error("Error recording installation activity changes:", error);
    return { count: 0 };
  }
}

export async function getInstallationByIdService(id: string) {
  return findInstallationById(id);
}

export async function getInstallationsService(params: FindInstallationsParams) {
  return findInstallations(params);
}

export async function createInstallationService(body: CreateInstallationInput) {
  const errors = validateInstallationInput({
    client_id: body.client_id,
    service_type_id: body.service_type_id,
    installation_date: body.installation_date,
  });

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const clientId = String(body.client_id).trim();
  const parsedServiceTypeId = toNumberOrFallback(body.service_type_id, null);
  const parsedInstallationDate = toDateOrFallback(body.installation_date, null);
  const parsedEstimatedAmount = parseNullableNumber(body.estimated_amount);
  const parsedFinalAmount = parseNullableNumber(body.final_amount);
  const parsedCostAmount = parseNullableNumber(body.cost_amount);
  const parsedWarrantyMonths = parseNullableNumber(body.warranty_months);
  const parsedLatitude = parseNullableNumber(body.latitude);
  const parsedLongitude = parseNullableNumber(body.longitude);
  const parsedWarrantyEndDate = toDateOrFallback(body.warranty_end_date, null);

  if (parsedServiceTypeId === null) {
    return {
      success: false,
      errors: [{ field: "service_type_id", error: "invalid" }],
    };
  }

  if (!parsedInstallationDate) {
    return {
      success: false,
      errors: [{ field: "installation_date", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.estimated_amount, parsedEstimatedAmount)) {
    return {
      success: false,
      errors: [{ field: "estimated_amount", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.final_amount, parsedFinalAmount)) {
    return {
      success: false,
      errors: [{ field: "final_amount", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.cost_amount, parsedCostAmount)) {
    return {
      success: false,
      errors: [{ field: "cost_amount", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.warranty_months, parsedWarrantyMonths)) {
    return {
      success: false,
      errors: [{ field: "warranty_months", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.latitude, parsedLatitude)) {
    return {
      success: false,
      errors: [{ field: "latitude", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.longitude, parsedLongitude)) {
    return {
      success: false,
      errors: [{ field: "longitude", error: "invalid" }],
    };
  }

  const clientExists = await findClientById(clientId);
  if (!clientExists) {
    return { success: false, code: "client_not_found" };
  }

  const serviceTypeExists = await findServiceTypeById(parsedServiceTypeId);
  if (!serviceTypeExists) {
    return { success: false, code: "service_type_not_found" };
  }

  const addressLine = toTrimmedStringOrFallback(body.address_line, null);
  const zone = toTrimmedStringOrFallback(body.zone, null);
  const adminLevel1 = toTrimmedStringOrFallback(body.admin_level_1, null);
  const adminLevel2 = toTrimmedStringOrFallback(body.admin_level_2, null);
  const adminLevel3 = toTrimmedStringOrFallback(body.admin_level_3, null);
  const city =
    toTrimmedStringOrFallback(body.city, null) || adminLevel3 || adminLevel2;

  let fullAddress = "";

  if (addressLine) fullAddress += addressLine;
  if (adminLevel3) fullAddress += `${fullAddress ? ", " : ""}${adminLevel3}`;
  if (adminLevel2) fullAddress += `${fullAddress ? ", " : ""}${adminLevel2}`;
  if (adminLevel1) fullAddress += `${fullAddress ? ", " : ""}${adminLevel1}`;
  if (zone) fullAddress += `${fullAddress ? ", " : ""}${zone}`;
  fullAddress += `${fullAddress ? ", " : ""}Costa Rica`;

  let finalLatitude = parsedLatitude;
  let finalLongitude = parsedLongitude;

  if (
    (finalLatitude === null || finalLongitude === null) &&
    fullAddress.trim() !== ""
  ) {
    const geo = await getCoordinatesFromAddress(fullAddress);

    if (geo) {
      finalLatitude = geo.latitude;
      finalLongitude = geo.longitude;
    }
  }

  const data: CreateInstallationData = {
    client_id: clientId,
    service_type_id: parsedServiceTypeId,
    installation_date: parsedInstallationDate,
    description: toTrimmedStringOrFallback(body.description, null),
    technical_observations: toTrimmedStringOrFallback(
      body.technical_observations,
      null,
    ),
    estimated_amount: parsedEstimatedAmount,
    final_amount: parsedFinalAmount,
    cost_amount: parsedCostAmount,
    warranty_months: parsedWarrantyMonths,
    warranty_end_date: parsedWarrantyEndDate,
    technician_name: toTrimmedStringOrFallback(body.technician_name, null),
    technician_id: toTrimmedStringOrFallback(body.technician_id, null),
    address_line: addressLine,
    zone,
    city: city || null,
    admin_level_1: adminLevel1,
    admin_level_2: adminLevel2,
    admin_level_3: adminLevel3,
    latitude: finalLatitude,
    longitude: finalLongitude,
    location_notes: toTrimmedStringOrFallback(body.location_notes, null),
    reference_point: toTrimmedStringOrFallback(body.reference_point, null),
    installation_status: InstallationStatus.OPEN,
    is_active: true,
    billing_status: toWorkBillingStatusOrFallback(
      body.billing_status,
      WorkBillingStatus.PENDING,
    ),
    billing_notes: toTrimmedStringOrFallback(body.billing_notes, null),
    billing_block_reason: toTrimmedStringOrFallback(
      body.billing_block_reason,
      null,
    ),
  };

  const installation = await createInstallation(data);

  await recordInstallationCreatedActivitySafely(installation);

  console.log(
    "Automatic invoice creation from installation is disabled. Use Finance > Pending Billables to generate the invoice.",
    {
      installationId: installation.installation_id,
    },
  );

  return { success: true, installation };
}

export async function updateInstallationByIdService(
  id: string,
  body: UpdateInstallationInput,
) {
  const existing = await findInstallationById(id);

  if (!existing) {
    return null;
  }

  const mergedBody = {
    client_id: body.client_id ?? existing.client_id,
    service_type_id: body.service_type_id ?? existing.service_type_id,
    installation_date:
      body.installation_date ?? existing.installation_date.toISOString(),
  };

  const errors = validateInstallationInput(mergedBody);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const parsedEstimatedAmount = parseUpdateNumber(
    body.estimated_amount,
    decimalToNumber(existing.estimated_amount),
  );

  const parsedFinalAmount = parseUpdateNumber(
    body.final_amount,
    decimalToNumber(existing.final_amount),
  );

  const parsedCostAmount = parseUpdateNumber(
    body.cost_amount,
    decimalToNumber(existing.cost_amount),
  );

  const parsedWarrantyMonths = parseUpdateNumber(
    body.warranty_months,
    existing.warranty_months,
  );

  const parsedLatitude = parseUpdateNumber(
    body.latitude,
    decimalToNumber(existing.latitude),
  );

  const parsedLongitude = parseUpdateNumber(
    body.longitude,
    decimalToNumber(existing.longitude),
  );

  if (isInvalidProvidedNumber(body.estimated_amount, parsedEstimatedAmount)) {
    return {
      success: false,
      errors: [{ field: "estimated_amount", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.final_amount, parsedFinalAmount)) {
    return {
      success: false,
      errors: [{ field: "final_amount", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.cost_amount, parsedCostAmount)) {
    return {
      success: false,
      errors: [{ field: "cost_amount", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.warranty_months, parsedWarrantyMonths)) {
    return {
      success: false,
      errors: [{ field: "warranty_months", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.latitude, parsedLatitude)) {
    return {
      success: false,
      errors: [{ field: "latitude", error: "invalid" }],
    };
  }

  if (isInvalidProvidedNumber(body.longitude, parsedLongitude)) {
    return {
      success: false,
      errors: [{ field: "longitude", error: "invalid" }],
    };
  }

  const adminLevel1 = toNullableStringOnUpdate(
    body.admin_level_1,
    existing.admin_level_1,
  );

  const adminLevel2 = toNullableStringOnUpdate(
    body.admin_level_2,
    existing.admin_level_2,
  );

  const adminLevel3 = toNullableStringOnUpdate(
    body.admin_level_3,
    existing.admin_level_3,
  );

  const city =
    body.city !== undefined
      ? toTrimmedStringOrFallback(body.city, null)
      : adminLevel3 || adminLevel2 || existing.city;

  const data: UpdateInstallationData = {
    client_id: body.client_id ?? existing.client_id,
    service_type_id:
      toNumberOrFallback(body.service_type_id, existing.service_type_id) ??
      undefined,
    installation_date:
      toDateOrFallback(body.installation_date, existing.installation_date) ??
      undefined,
    description: toTrimmedStringOrFallback(
      body.description,
      existing.description,
    ),
    technical_observations: toTrimmedStringOrFallback(
      body.technical_observations,
      existing.technical_observations,
    ),
    estimated_amount: parsedEstimatedAmount,
    final_amount: parsedFinalAmount,
    cost_amount: parsedCostAmount,
    warranty_months: parsedWarrantyMonths,
    warranty_end_date: toDateOrFallback(
      body.warranty_end_date,
      existing.warranty_end_date,
    ),
    technician_name: toTrimmedStringOrFallback(
      body.technician_name,
      existing.technician_name,
    ),
    technician_id:
      body.technician_id !== undefined
        ? toTrimmedStringOrFallback(body.technician_id, null)
        : existing.technician_id,
    address_line: toNullableStringOnUpdate(
      body.address_line,
      existing.address_line,
    ),
    zone: toNullableStringOnUpdate(body.zone, existing.zone),
    city,
    admin_level_1: adminLevel1,
    admin_level_2: adminLevel2,
    admin_level_3: adminLevel3,
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    location_notes: toNullableStringOnUpdate(
      body.location_notes,
      existing.location_notes,
    ),
    reference_point: toNullableStringOnUpdate(
      body.reference_point,
      existing.reference_point,
    ),
    installation_status:
      body.installation_status !== undefined
        ? toInstallationStatusOrFallback(
            body.installation_status,
            existing.installation_status,
          )
        : existing.installation_status,
    is_active:
      body.is_active !== undefined ? body.is_active : existing.is_active,
    billing_status:
      body.billing_status !== undefined
        ? toWorkBillingStatusOrFallback(
            body.billing_status,
            existing.billing_status,
          )
        : existing.billing_status,
    billing_notes: toNullableStringOnUpdate(
      body.billing_notes,
      existing.billing_notes,
    ),
    billing_block_reason: toNullableStringOnUpdate(
      body.billing_block_reason,
      existing.billing_block_reason,
    ),
  };

  const updated = await updateInstallation(id, data);

  const changedBy = toTrimmedStringOrFallback(body.changed_by, "system");

  const trackedChanges = [
    {
      field_name: "client_id",
      old_value: existing.client_id,
      new_value: updated.client_id,
    },
    {
      field_name: "service_type_id",
      old_value: existing.service_type_id,
      new_value: updated.service_type_id,
    },
    {
      field_name: "installation_date",
      old_value: existing.installation_date,
      new_value: updated.installation_date,
    },
    {
      field_name: "description",
      old_value: existing.description,
      new_value: updated.description,
    },
    {
      field_name: "technical_observations",
      old_value: existing.technical_observations,
      new_value: updated.technical_observations,
    },
    {
      field_name: "estimated_amount",
      old_value: decimalToNumber(existing.estimated_amount),
      new_value: decimalToNumber(updated.estimated_amount),
    },
    {
      field_name: "warranty_months",
      old_value: existing.warranty_months,
      new_value: updated.warranty_months,
    },
    {
      field_name: "warranty_end_date",
      old_value: existing.warranty_end_date,
      new_value: updated.warranty_end_date,
    },
    {
      field_name: "technician_name",
      old_value: existing.technician_name,
      new_value: updated.technician_name,
    },
    {
      field_name: "technician_id",
      old_value: existing.technician_id,
      new_value: updated.technician_id,
    },
    {
      field_name: "installation_status",
      old_value: existing.installation_status,
      new_value: updated.installation_status,
    },
    {
      field_name: "is_active",
      old_value: existing.is_active,
      new_value: updated.is_active,
    },
  ];

  const changesToInsert = trackedChanges
    .filter((change) => valuesAreDifferent(change.old_value, change.new_value))
    .map((change) => ({
      installation_id: id,
      field_name: change.field_name,
      old_value: stringifyChangeValue(change.old_value),
      new_value: stringifyChangeValue(change.new_value),
      changed_by: changedBy,
    }));

  if (changesToInsert.length > 0) {
    await prisma.installationChangeLog.createMany({
      data: changesToInsert,
    });
  }

  await recordInstallationActivityChangesSafely({
    before: existing,
    after: updated,
    changedBy,
  });

  return { success: true, installation: updated };
}

export async function inactivateInstallationByIdService(
  id: string,
  changedBy?: string | null,
) {
  const existing = await findInstallationById(id);

  if (!existing) {
    return null;
  }

  if (!existing.is_active) {
    return { success: true, installation: existing };
  }

  const updated = await updateInstallation(id, {
    is_active: false,
  });

  const finalChangedBy = toTrimmedStringOrFallback(changedBy, "system");

  await prisma.installationChangeLog.create({
    data: {
      installation_id: id,
      field_name: "is_active",
      old_value: "true",
      new_value: "false",
      changed_by: finalChangedBy,
    },
  });

  await recordInstallationActivityChangesSafely({
    before: existing,
    after: updated,
    changedBy: finalChangedBy,
  });

  return { success: true, installation: updated };
}
