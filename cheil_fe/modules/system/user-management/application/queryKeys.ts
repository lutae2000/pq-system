export const userManagementQueryKeys = {
  all: ["system", "user-management"] as const,
  usersRoot: ["auth-users"] as const,
  permissions: (employeeNo: string) => ["system", "user-management", "permissions", employeeNo] as const,
};
