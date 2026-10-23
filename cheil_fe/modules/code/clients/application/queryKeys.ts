import type { ClientCodeSearchParams } from "@/modules/code/clients/api";

export const clientCodeQueryKeys = {
  all: ["client-codes"] as const,
  list: (params: ClientCodeSearchParams, revision: number) => ["client-codes", params, revision] as const,
};
