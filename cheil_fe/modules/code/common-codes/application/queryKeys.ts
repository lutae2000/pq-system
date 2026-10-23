export const commonCodeManagementQueryKeys = {
  all: ["common-codes-management"] as const,
  list: (filters: unknown) => ["common-codes-management", filters] as const,
};
