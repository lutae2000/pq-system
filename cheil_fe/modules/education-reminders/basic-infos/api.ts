import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type {
  EducationReminderBasicInfoEngineerAssignRequest,
  EducationReminderBasicInfoEngineerRecord,
  EducationReminderBasicInfoRecord,
  EducationReminderBasicInfoRequest,
} from "../types";

const BASE = "/education-reminders/basic-infos";

export async function listEducationReminderBasicInfos(): Promise<EducationReminderBasicInfoRecord[]> {
  return apiRequest(apiClient.get(BASE), "교육 알림 기초 정보를 불러오지 못했습니다.");
}

export async function createEducationReminderBasicInfo(request: EducationReminderBasicInfoRequest): Promise<EducationReminderBasicInfoRecord> {
  return apiRequest(apiClient.post(BASE, request), "교육 알림 기초 정보를 저장하지 못했습니다.");
}

export async function updateEducationReminderBasicInfo(id: string, request: EducationReminderBasicInfoRequest): Promise<EducationReminderBasicInfoRecord> {
  return apiRequest(apiClient.put(`${BASE}/${encodeURIComponent(String(id))}`, request), "교육 알림 기초 정보를 저장하지 못했습니다.");
}

export async function deleteEducationReminderBasicInfo(id: string): Promise<void> {
  await apiRequest(apiClient.delete(`${BASE}/${encodeURIComponent(String(id))}`), "교육 알림 기초 정보를 삭제하지 못했습니다.");
}

export async function listEducationReminderBasicInfoEngineers(basicInfoCode: string): Promise<EducationReminderBasicInfoEngineerRecord[]> {
  return apiRequest(
    apiClient.get(`${BASE}/${encodeURIComponent(basicInfoCode)}/engineers`),
    "할당 기술인 목록을 불러오지 못했습니다.",
  );
}

export async function addEducationReminderBasicInfoEngineers(
  basicInfoCode: string,
  request: EducationReminderBasicInfoEngineerAssignRequest,
): Promise<EducationReminderBasicInfoEngineerRecord[]> {
  return apiRequest(
    apiClient.post(`${BASE}/${encodeURIComponent(basicInfoCode)}/engineers`, request),
    "할당 기술인을 추가하지 못했습니다.",
  );
}

export async function deleteEducationReminderBasicInfoEngineer(basicInfoCode: string, engineerId: string): Promise<void> {
  await apiRequest(
    apiClient.delete(`${BASE}/${encodeURIComponent(basicInfoCode)}/engineers/${encodeURIComponent(engineerId)}`),
    "할당 기술인을 삭제하지 못했습니다.",
  );
}
