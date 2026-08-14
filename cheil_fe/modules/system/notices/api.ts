import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { NoticeRecord } from "./notice.types";


export async function listNoticesAdmin(): Promise<NoticeRecord[]> {
  return apiRequest(apiClient.get("/system/notices?scope=ADMIN"), "공지사항 목록을 불러오지 못했습니다.");
}

export async function listNoticesDashboard(): Promise<NoticeRecord[]> {
  return apiRequest(apiClient.get("/system/notices?scope=DASHBOARD"), "공지사항 목록을 불러오지 못했습니다.");
}

export async function getNotice(noticeId: string): Promise<NoticeRecord> {
  return apiRequest(apiClient.get(`/system/notices/${encodeURIComponent(noticeId)}`), "공지사항을 불러오지 못했습니다.");
}

export async function createNotice(request: NoticeRecord): Promise<NoticeRecord> {
  return apiRequest(apiClient.post("/system/notices", request), "공지사항을 저장하지 못했습니다.");
}

export async function updateNotice(noticeId: string, request: NoticeRecord): Promise<NoticeRecord> {
  return apiRequest(apiClient.put(`/system/notices/${encodeURIComponent(noticeId)}`, request), "공지사항을 저장하지 못했습니다.");
}

export async function deleteNotice(noticeId: string): Promise<void> {
  await apiRequest(apiClient.delete(`/system/notices/${encodeURIComponent(noticeId)}`), "공지사항을 삭제하지 못했습니다.");
}
