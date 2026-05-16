import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateUserInput = {
  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
};

const allowedRoles = [
  "TECHNICIAN",
  "SUPERVISOR",
  "ADMINISTRATION",
  "ADMIN",
] as const;

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function validateRole(role: string | null) {
  return role && allowedRoles.includes(role as (typeof allowedRoles)[number]);
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        first_name: true,
        last_name_1: true,
        last_name_2: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as UpdateUserInput;

    const existing = await prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        first_name: true,
        last_name_1: true,
        last_name_2: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    const first_name = normalizeString(body.first_name) ?? existing.first_name;
    const last_name_1 =
      normalizeString(body.last_name_1) ?? existing.last_name_1;
    const last_name_2 =
      body.last_name_2 !== undefined
        ? normalizeString(body.last_name_2)
        : existing.last_name_2;
    const email =
      body.email !== undefined
        ? normalizeString(body.email)?.toLowerCase() ?? null
        : existing.email;
    const phone =
      body.phone !== undefined ? normalizeString(body.phone) : existing.phone;
    const role =
      body.role !== undefined ? normalizeString(body.role) : existing.role;
    const is_active =
      body.is_active !== undefined ? body.is_active : existing.is_active;

    const errors: Array<{ field: string; error: string }> = [];

    if (!first_name) {
      errors.push({ field: "first_name", error: "required" });
    }

    if (!last_name_1) {
      errors.push({ field: "last_name_1", error: "required" });
    }

    if (!role) {
      errors.push({ field: "role", error: "required" });
    } else if (!validateRole(role)) {
      errors.push({ field: "role", error: "invalid" });
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

    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
        select: { user_id: true },
      });

      if (existingByEmail && existingByEmail.user_id !== id) {
        return NextResponse.json(
          {
            success: false,
            message: "Email already exists",
          },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { user_id: id },
      data: {
        first_name,
        last_name_1,
        last_name_2,
        email,
        phone,
        role: role as never,
        is_active,
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
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
