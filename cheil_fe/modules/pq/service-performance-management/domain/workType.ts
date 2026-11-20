export const workTypeLabels = {
  DESIGN: "설계",
  SUPERVISION: "감리",
} as const;

export type ServicePerformanceWorkType = keyof typeof workTypeLabels;
