export const dashboardQueryKeys = {
  bidNoticeDetail: (bidSeq: number | null | undefined) => ["dashboard-bid-notice-detail", bidSeq ?? "none"] as const,
};
