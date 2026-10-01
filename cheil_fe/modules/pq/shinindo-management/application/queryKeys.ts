import type { ShinindoManagementSearchParams } from "@/modules/pq/shinindo-management/api";

const root = ["shinindo-management"] as const;

export const shinindoManagementQueryKeys = {
  all: root,
  list: (params: ShinindoManagementSearchParams) => [...root, "list", params] as const,
  detail: (id: number) => [...root, "detail", id] as const,
  client: (clientCode: string) => [...root, "client", clientCode] as const,
  clientOptions: (keyword: string) => [...root, "client-options", keyword] as const,
} as const;
