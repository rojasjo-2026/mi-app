import type { Prisma } from "@prisma/client";
import {
  createActivityLog,
  createManyActivityLogs,
} from "@/lib/repositories/activityLogRepository";
import { CLIENT_ACTIVITY_FIELDS } from "@/lib/clients/clientActivityLog.config";

type ActivitySourceRecord = Record<string, unknown>;

export function toActivityValue(value: unknown): string | null {
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

function normalizeForComparison(value: unknown) {
  return toActivityValue(value) ?? "";
}

export async function recordClientCreatedActivitySafely(client: unknown) {
  try {
    const record = client as ActivitySourceRecord;
    const clientId = toActivityValue(record.client_id);

    if (!clientId) {
      return null;
    }

    return createActivityLog({
      client_id: clientId,
      entity_type: "CLIENT",
      entity_id: clientId,
      category: "CLIENT",
      action: "CREATED",
      visibility: "PUBLIC_INTERNAL",
      title: "Cliente creado",
      description: "Se creó el cliente en el sistema.",
      created_by: null,
    });
  } catch (error) {
    console.error("Error recording client created activity:", error);
    return null;
  }
}

export async function recordClientActivityChangesSafely(params: {
  before: unknown;
  after: unknown;
}) {
  try {
    const beforeRecord = params.before as ActivitySourceRecord | null;
    const afterRecord = params.after as ActivitySourceRecord | null;

    const clientId = toActivityValue(
      afterRecord?.client_id ?? beforeRecord?.client_id,
    );

    if (!clientId) {
      return { count: 0 };
    }

    const logs: Prisma.ActivityLogCreateManyInput[] = [];

    for (const field of CLIENT_ACTIVITY_FIELDS) {
      const oldRawValue = beforeRecord?.[field.fieldName] ?? null;
      const newRawValue = afterRecord?.[field.fieldName] ?? null;

      if (
        normalizeForComparison(oldRawValue) ===
        normalizeForComparison(newRawValue)
      ) {
        continue;
      }

      logs.push({
        client_id: clientId,
        entity_type: "CLIENT",
        entity_id: clientId,
        category: field.category,
        action: field.action,
        visibility: field.visibility,
        field_name: field.fieldName,
        old_value: toActivityValue(oldRawValue),
        new_value: toActivityValue(newRawValue),
        title: field.title,
        description: field.description,
        created_by: null,
      });
    }

    return createManyActivityLogs(logs);
  } catch (error) {
    console.error("Error recording client activity changes:", error);
    return { count: 0 };
  }
}
