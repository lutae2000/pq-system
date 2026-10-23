export const constructionTypeManagementQueryKeys = {
  all: ["construction-types"] as const,
  list: (filters: unknown) => ["construction-types", filters] as const,
};
