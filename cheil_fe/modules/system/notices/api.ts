import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { NoticeRecord } from "./notice.types";

export type NotificationPreferenceOption = {
  notificationCode: string;
  notificationName: string;
  description: string | null;
  menuPath: string;
  receiveYn: boolean;
};

export async function getNotificationPreferences(): Promise<Record<string, boolean>> {
  return apiRequest(apiClient.get<Record<string, boolean>>("/system/notification-preferences"), "알림 설정을 불러오지 못했습니다.");
}

export async function listNotificationPreferenceOptions(): Promise<NotificationPreferenceOption[]> {
  return apiRequest(apiClient.get<NotificationPreferenceOption[]>("/system/notification-preferences/options"), "알림 설정 목록을 불러오지 못했습니다.");
}

export async function saveNotificationPreference(menuPath: string, receiveYn: boolean): Promise<void> {
  await apiRequest(apiClient.put("/system/notification-preferences", { menuPath, receiveYn }), "알림 설정을 저장하지 못했습니다.");
}

export async function createTechnologyNotice(params: { title: string; content: string; targetPath: string }): Promise<NoticeRecord> {
  const now = new Date();
  const format = (date: Date) => date.toISOString().slice(0, 16).replace("T", " ");
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);
  return createNotice({
    active: true,
    content: params.content,
    exposureEndAt: format(end),
    exposureStartAt: format(now),
    id: "",
    important: false,
    publishAt: format(now),
    targetPath: params.targetPath,
    title: params.title,
  });
}


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
