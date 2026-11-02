const root = ["construction-project-performances"] as const;

export const constructionProjectPerformanceQueryKeys = {
  all: root,
  list: (params: Record<string, unknown>) => [...root, "list", params] as const,
} as const;
