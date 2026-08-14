import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { EducationReminderTemplateRecord, EducationReminderTemplateRequest } from "../types";

const BASE = "/education-reminders/templates";

export async function listEducationReminderTemplates(): Promise<EducationReminderTemplateRecord[]> {
  return apiRequest(apiClient.get(BASE), "교육 알림 템플릿을 불러오지 못했습니다.");
}

export async function createEducationReminderTemplate(request: EducationReminderTemplateRequest): Promise<EducationReminderTemplateRecord> {
  return apiRequest(apiClient.post(BASE, request), "교육 알림 템플릿을 저장하지 못했습니다.");
}

export async function updateEducationReminderTemplate(id: number, request: EducationReminderTemplateRequest): Promise<EducationReminderTemplateRecord> {
  return apiRequest(apiClient.put(`${BASE}/${encodeURIComponent(String(id))}`, request), "교육 알림 템플릿을 저장하지 못했습니다.");
}

export async function deleteEducationReminderTemplate(id: number): Promise<void> {
  await apiRequest(apiClient.delete(`${BASE}/${encodeURIComponent(String(id))}`), "교육 알림 템플릿을 삭제하지 못했습니다.");
}
