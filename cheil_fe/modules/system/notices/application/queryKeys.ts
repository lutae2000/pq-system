const root = ["system-notices"] as const;

export const noticeQueryKeys = {
  all: root,
  list: () => [...root, "list"] as const,
} as const;
