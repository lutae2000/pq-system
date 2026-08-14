export type DashboardCategoryKey = "design" | "urbanPlanning" | "waterMaintenance" | "supervision";

export type DashboardCategory = {
  key: DashboardCategoryKey;
  label: string;
  color: string;
};

export type MonthlyCategoryPoint = {
  month: string;
  achievement: number;
  plan: number;
};

export type CategoryMonthlySeries = {
  category: DashboardCategory;
  points: MonthlyCategoryPoint[];
};

export type MonthlyCategoryRecord = {
  month: string;
} & Record<DashboardCategoryKey, number>;

export type MonthlyBidRecord = {
  month: string;
  submittedBids: number;
  awardedBids: number;
};

export type MonthlyAwardAmountRecord = {
  month: string;
  awardAmount: number;
};
