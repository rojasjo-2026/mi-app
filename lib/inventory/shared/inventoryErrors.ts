import { Prisma } from "@prisma/client";

import type { InventoryFieldErrors } from "./inventoryServiceResult.types";

type InventoryValidationErrorOptions = {
  status?: number;
  errors?: InventoryFieldErrors;
};

export class InventoryValidationError extends Error {
  readonly status: number;
  readonly errors?: InventoryFieldErrors;

  constructor(message: string, options: InventoryValidationErrorOptions = {}) {
    super(message);

    this.name = "InventoryValidationError";
    this.status = options.status ?? 400;
    this.errors = options.errors;
  }
}

export function isPrismaUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function isPrismaRecordNotFoundError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export function isPrismaForeignKeyConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
