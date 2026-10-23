const root = ["references"] as const;

export const referenceQueryKeys = {
  rolesRoot: [...root, "roles"] as const,
  roles: <T>(params: T) => [...root, "roles", params] as const,
  usersRoot: [...root, "users"] as const,
  users: <T>(params: T) => [...root, "users", params] as const,
  clientsRoot: [...root, "clients"] as const,
  clients: <T>(params: T) => [...root, "clients", params] as const,
  clientByCode: (code: string) => [...root, "clients", "by-code", code] as const,
  departmentsRoot: [...root, "departments"] as const,
  departments: <T>(params: T) => [...root, "departments", params] as const,
  constructionTypesRoot: [...root, "construction-types"] as const,
  constructionTypes: <T>(params: T) => [...root, "construction-types", params] as const,
} as const;
