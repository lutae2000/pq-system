import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type DashboardBidNoticeCalendarRecord = {
  bidSeq: number;
  projectName: string;
  orderClient: string | null;
  eventType: "PQ_SUBMIT" | "BID_DATE" | "INTERVIEW_DATE";
  scheduledAt: string;
  scheduledDate: string;
};

export type DashboardBidNoticeSummary = {
  bidCount: number;
  successCount: number;
  designAmount: number;
};

export type DashboardDepartmentSummary = {
  departmentCode: string | null;
  departmentName: string;
  bidCount: number;
  successCount: number;
  designAmount: number;
};

export function listDashboardDepartmentSummaries(): Promise<DashboardDepartmentSummary[]> {
  return apiRequest(
    apiClient.get<DashboardDepartmentSummary[]>("/dashboard/bid-notices/summary/departments"),
    "부서별 낙찰 현황을 불러오지 못했습니다.",
  );
}

export function getDashboardBidNoticeSummary(): Promise<DashboardBidNoticeSummary> {
  return apiRequest(
    apiClient.get<DashboardBidNoticeSummary>("/dashboard/bid-notices/summary"),
    "연간 입찰 현황을 불러오지 못했습니다.",
  );
}

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
