import type { NewTechnologyDevelopmentSearchParams } from "@/modules/pq/new-technology-developments/api";

const root = ["new-technology-developments"] as const;

export const newTechnologyDevelopmentQueryKeys = {
  all: root,
  list: (params: NewTechnologyDevelopmentSearchParams) => [...root, "list", params] as const,
  detail: (id: number, scoreReferenceDate: string) => [...root, "detail", id, scoreReferenceDate] as const,
} as const;
