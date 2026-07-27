import { prisma } from "@/lib/prisma";

import type {
  UnitOfMeasureCreateData,
  UnitOfMeasureFilters,
  UnitOfMeasureUpdateData,
} from "./unitOfMeasure.types";

export function findUnitOfMeasures(filters: UnitOfMeasureFilters) {
  return prisma.unitOfMeasure.findMany({
    where: {
      ...(filters.activeOnly ? { is_active: true } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                code: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                symbol: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ name: "asc" }, { code: "asc" }],
  });
}

export function findUnitOfMeasureById(unitOfMeasureId: string) {
  return prisma.unitOfMeasure.findUnique({
    where: {
      unit_of_measure_id: unitOfMeasureId,
    },
  });
}

export function findUnitOfMeasureByCode(code: string) {
  return prisma.unitOfMeasure.findUnique({
    where: {
      code,
    },
  });
}

export function createUnitOfMeasureRecord(data: UnitOfMeasureCreateData) {
  return prisma.unitOfMeasure.create({
    data: {
      code: data.code,
      name: data.name,
      symbol: data.symbol,
      allows_decimal: data.allows_decimal,
      decimal_scale: data.decimal_scale,
      is_active: true,
    },
  });
}

export function updateUnitOfMeasureRecord(
  unitOfMeasureId: string,
  data: UnitOfMeasureUpdateData,
) {
  return prisma.unitOfMeasure.update({
    where: {
      unit_of_measure_id: unitOfMeasureId,
    },
    data,
  });
}

export function deactivateUnitOfMeasureRecord(unitOfMeasureId: string) {
  return prisma.unitOfMeasure.update({
    where: {
      unit_of_measure_id: unitOfMeasureId,
    },
    data: {
      is_active: false,
    },
  });
}
