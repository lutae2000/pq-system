import type { ServicePerformanceSearchParams } from "@/modules/pq/service-performance-management/api";

const root = ["service-performance-management"] as const;

export const servicePerformanceQueryKeys = {
  all: root,
  list: (params: ServicePerformanceSearchParams) => [...root, "list", params] as const,
  detail: (id: number) => [...root, "detail", id] as const,
} as const;
