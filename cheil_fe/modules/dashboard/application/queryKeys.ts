export const dashboardQueryKeys = {
  annualSummary: (year: number) => ["dashboard-bid-notice-summary", year] as const,
  departmentSummary: (year: number) => ["dashboard-bid-notice-department-summary", year] as const,
  bidNoticeDetail: (bidSeq: number | null | undefined) => ["dashboard-bid-notice-detail", bidSeq ?? "none"] as const,
};
