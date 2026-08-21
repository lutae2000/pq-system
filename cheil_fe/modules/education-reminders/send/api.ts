import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type {
  EducationReminderSendHistoryRecord,
  EducationReminderSendRequest,
  EducationReminderSendResponse,
  EducationReminderSendRetryRequest,
  EducationReminderSendRetryResponse,
} from "./types";

const BASE = "/education-reminders";

export async function createEducationReminderSend(request: EducationReminderSendRequest): Promise<EducationReminderSendResponse> {
  return apiRequest(apiClient.post(`${BASE}/send`, request), "교육알림 발송 처리를 하지 못했습니다.");
}

export async function listEducationReminderSendHistory(params: {
  channel?: string;
  keyword?: string;
  requestedFrom?: string;
  requestedTo?: string;
  status?: string;
} = {}): Promise<EducationReminderSendHistoryRecord[]> {
  return apiRequest(apiClient.get(`${BASE}/send-history`, { params }), "교육알림 발송 이력을 불러오지 못했습니다.");
}

export async function retryEducationReminderSend(request: EducationReminderSendRetryRequest): Promise<EducationReminderSendRetryResponse> {
  return apiRequest(apiClient.post(`${BASE}/send-history/retry`, request), "교육알림 재발송을 처리하지 못했습니다.");
}
