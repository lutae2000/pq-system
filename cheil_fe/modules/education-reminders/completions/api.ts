import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type {
  EducationReminderCompletionRecord,
  EducationReminderCompletionSearchParams,
  EducationReminderCompletionUpsertRequest,
  EducationReminderNotificationPhoneUpsertRequest,
  EducationReminderNotificationTargetRecord,
} from "../types";

const COMPLETIONS_BASE = "/education-reminders/completions";
const NOTIFICATION_TARGETS_BASE = "/education-reminders/notification-targets";
const NOTIFICATION_PHONES_BASE = "/education-reminders/notification-phones";

export async function listEducationReminderCompletions(
  params: EducationReminderCompletionSearchParams = {},
): Promise<EducationReminderCompletionRecord[]> {
  return apiRequest(apiClient.get(COMPLETIONS_BASE, { params }), "교육 알림 이수 정보를 불러오지 못했습니다.");
}

export async function saveEducationReminderCompletion(
  request: EducationReminderCompletionUpsertRequest,
): Promise<EducationReminderCompletionRecord> {
  return apiRequest(apiClient.put(COMPLETIONS_BASE, request), "교육 알림 이수 정보를 저장하지 못했습니다.");
}

export async function listEducationReminderNotificationTargets(
  params: Pick<EducationReminderCompletionSearchParams, "jobField" | "name" | "specialtyField"> = {},
): Promise<EducationReminderNotificationTargetRecord[]> {
  return apiRequest(apiClient.get(NOTIFICATION_TARGETS_BASE, { params }), "교육 알림 발송 대상을 불러오지 못했습니다.");
}

export async function saveEducationReminderNotificationPhone(
  engrId: string,
  request: EducationReminderNotificationPhoneUpsertRequest,
): Promise<void> {
  return apiRequest(apiClient.put(`${NOTIFICATION_PHONES_BASE}/${engrId}`, request), "전화번호를 저장하지 못했습니다.");
}
