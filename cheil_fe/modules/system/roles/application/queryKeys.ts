const root = ["system-roles"] as const;

export const rolePermissionQueryKeys = {
  all: root,
  roles: [...root, "roles"] as const,
  menus: [...root, "menus"] as const,
  permissions: (roleCode: string) => [...root, "permissions", roleCode || "none"] as const,
} as const;
