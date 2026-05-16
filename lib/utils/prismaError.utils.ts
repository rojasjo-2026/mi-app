import { Prisma } from "@prisma/client";

type DuplicateErrorInfo = {
  status: number;
  message: string;
  errors?: Array<{ field?: string; error: string }>;
};

function getPrismaDuplicateTargets(error: unknown): string[] {
  if (typeof error !== "object" || error === null) {
    return [];
  }

  const prismaError = error as { meta?: { target?: unknown }; cause?: unknown };
  const rawTargets = prismaError.meta?.target;

  const targets = Array.isArray(rawTargets)
    ? rawTargets.map((item) => String(item))
    : typeof rawTargets === "string"
      ? [rawTargets]
      : [];

  if (targets.length === 0 && prismaError.cause) {
    return getPrismaDuplicateTargets(prismaError.cause);
  }

  const extractedFields = new Set<string>();
  const knownFields = [
    "identification_country",
    "identification_type",
    "identification_number",
  ];

  for (const target of targets) {
    const normalized = target.toLowerCase();

    for (const field of knownFields) {
      if (normalized.includes(field)) {
        extractedFields.add(field);
      }
    }
  }

  return Array.from(extractedFields);
}

export function getFriendlyPrismaDuplicateError(
  error: unknown,
  modelName: string,
): DuplicateErrorInfo | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    (error as { code: unknown }).code !== "P2002"
  ) {
    return null;
  }

  const targets = getPrismaDuplicateTargets(error);

  if (modelName === "Client") {
    if (
      targets.includes("identification_country") &&
      targets.includes("identification_type") &&
      targets.includes("identification_number")
    ) {
      return {
        status: 409,
        message:
          "Ya existe un cliente con este tipo y número de identificación.",
        errors: [
          {
            field: "identification_number",
            error: "unique",
          },
        ],
      };
    }
  }

  return {
    status: 409,
    message: "Ya existe un cliente con información duplicada.",
    errors: targets.map((field) => ({
      field,
      error: "unique",
    })),
  };
}
