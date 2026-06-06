import {
  PERMISSION_GROUPS,
  ROLE_PERMISSION_OVERRIDES,
  STAFF_ROLES,
  type UserPermissions,
  type UserRole,
} from "./userFormConfig";

export function createEmptyPermissions(): UserPermissions {
  return PERMISSION_GROUPS.reduce<UserPermissions>((acc, group) => {
    acc[group.key] = group.items.reduce<Record<string, boolean>>(
      (itemAcc, item) => {
        itemAcc[item.key] = false;
        return itemAcc;
      },
      {},
    );

    return acc;
  }, {});
}

export function clonePermissions(value: UserPermissions): UserPermissions {
  return JSON.parse(JSON.stringify(value)) as UserPermissions;
}

export function createRolePermissions(role: UserRole): UserPermissions {
  const permissions = createEmptyPermissions();

  if (role === "ADMIN") {
    PERMISSION_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        permissions[group.key][item.key] = true;
      });
    });

    return permissions;
  }

  const overrides = ROLE_PERMISSION_OVERRIDES[role];

  PERMISSION_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      permissions[group.key][item.key] =
        overrides?.[group.key]?.[item.key] ?? false;
    });
  });

  return permissions;
}

export function toUserRole(value?: string | null): UserRole {
  if (STAFF_ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }

  return "TECHNICIAN";
}

export function mergePermissions(
  role: UserRole,
  incomingPermissions: unknown,
): UserPermissions {
  const base = createRolePermissions(role);

  if (
    !incomingPermissions ||
    typeof incomingPermissions !== "object" ||
    Array.isArray(incomingPermissions)
  ) {
    return base;
  }

  const incoming = incomingPermissions as Record<
    string,
    Record<string, unknown>
  >;
  const merged = clonePermissions(base);

  PERMISSION_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      const value = incoming[group.key]?.[item.key];

      if (typeof value === "boolean") {
        merged[group.key][item.key] = value;
      }
    });
  });

  return merged;
}

