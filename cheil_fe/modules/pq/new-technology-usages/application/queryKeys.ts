import type { NewTechnologyUsageSearchParams } from "@/modules/pq/new-technology-usages/api";

const root = ["new-technology-usages"] as const;

export const newTechnologyUsageQueryKeys = {
  all: root,
  lists: [...root, "list"] as const,
  list: (params: NewTechnologyUsageSearchParams) => [...root, "list", params] as const,
  detail: (id: number) => [...root, "detail", id] as const,
} as const;
