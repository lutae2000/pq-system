export const userManagementQueryKeys = {
  all: ["system", "user-management"] as const,
  usersRoot: ["auth-users"] as const,
  permissions: (loginId: string) => ["system", "user-management", "permissions", loginId] as const,
};
