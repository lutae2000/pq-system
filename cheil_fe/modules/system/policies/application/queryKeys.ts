const root = ["system-policies"] as const;

export const systemPolicyQueryKeys = {
  all: root,
  list: () => [...root, "list"] as const,
} as const;
