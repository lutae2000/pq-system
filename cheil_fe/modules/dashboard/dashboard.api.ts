import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type DashboardBidNoticeCalendarRecord = {
  bidSeq: number;
  projectName: string;
  orderClient: string | null;
  eventType: "PQ_SUBMIT" | "BID_DATE";
  scheduledAt: string;
  scheduledDate: string;
};

export async function listDashboardBidNoticeCalendar(
  yearMonth: string,
  deptCode?: string,
): Promise<DashboardBidNoticeCalendarRecord[]> {
  const params: Record<string, string> = { yearMonth };
  if (deptCode && deptCode !== "All") {
    params.deptCode = deptCode;
  }

  return apiRequest(
    apiClient.get<DashboardBidNoticeCalendarRecord[]>("/dashboard/bid-notices/calendar", {
      params,
    }),
    "대시보드 일정 정보를 불러오지 못했습니다.",
  );
}
