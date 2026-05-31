import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, StaffRole } from "@prisma/client";

type CreateUserInput = {
  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
  permissions?: unknown;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function isValidStaffRole(role: string | null): role is StaffRole {
  return !!role && Object.values(StaffRole).includes(role as StaffRole);
}

function normalizePermissions(
  value: unknown,
): Prisma.InputJsonObject | undefined {
  if (value === undefined) return undefined;
  if (value === null) return {};

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }

  return undefined;
}

function isInvalidPermissions(value: unknown) {
  if (value === undefined) return false;
  if (value === null) return false;
  return typeof value !== "object" || Array.isArray(value);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const roleParam = searchParams.get("role");
    const isActiveParam = searchParams.get("is_active");
    const search = searchParams.get("search");

    const role =
      roleParam && Object.values(StaffRole).includes(roleParam as StaffRole)
        ? (roleParam as StaffRole)
        : undefined;

    const is_active =
      isActiveParam === null
        ? undefined
        : isActiveParam.toLowerCase() === "true";

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
        ...(search
          ? {
              OR: [
                {
                  first_name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  last_name_1: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  last_name_2: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        user_id: true,
        first_name: true,
        last_name_1: true,
        last_name_2: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        permissions: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: [{ first_name: "asc" }, { last_name_1: "asc" }],
    });

    return NextResponse.json(
      {
        success: true,
        data: users,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateUserInput;

    const first_name = normalizeString(body.first_name);
    const last_name_1 = normalizeString(body.last_name_1);
    const last_name_2 = normalizeString(body.last_name_2);
    const email = normalizeString(body.email)?.toLowerCase() ?? null;
    const phone = normalizeString(body.phone);
    const role = normalizeString(body.role);
    const is_active = body.is_active ?? true;
    const permissions = normalizePermissions(body.permissions);

    const errors: Array<{ field: string; error: string }> = [];

    if (!first_name) {
      errors.push({ field: "first_name", error: "required" });
    }

    if (!last_name_1) {
      errors.push({ field: "last_name_1", error: "required" });
    }

    if (!role) {
      errors.push({ field: "role", error: "required" });
    } else if (!isValidStaffRole(role)) {
      errors.push({ field: "role", error: "invalid" });
    }

    if (isInvalidPermissions(body.permissions)) {
      errors.push({ field: "permissions", error: "invalid" });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors,
        },
        { status: 400 },
      );
    }

    const safeFirstName = first_name!;
    const safeLastName1 = last_name_1!;
    const safeRole = role as StaffRole;

    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
        select: { user_id: true },
      });

      if (existingByEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "Email already exists",
          },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        first_name: safeFirstName,
        last_name_1: safeLastName1,
        last_name_2,
        email,
        phone,
        role: safeRole,
        is_active,
        ...(permissions !== undefined ? { permissions } : {}),
      },
      select: {
        user_id: true,
        first_name: true,
        last_name_1: true,
        last_name_2: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        permissions: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
