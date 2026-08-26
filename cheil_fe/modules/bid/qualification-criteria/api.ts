import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type {
  QualificationCriteriaSearchParams,
  QualificationReviewAgencyRecord,
  QualificationReviewAgencyUpsertRequest,
  QualificationReviewCriterionRecord,
  QualificationReviewCriterionUpsertRequest,
  QualificationScoreBandRecord,
  QualificationScoreBandUpsertRequest,
} from "./qualificationCriteria.types";

const BASE_URL = "/bid/qualification-criteria";

export async function listQualificationReviewAgencies(
  params: QualificationCriteriaSearchParams = {},
): Promise<QualificationReviewAgencyRecord[]> {
  return apiRequest(apiClient.get(`${BASE_URL}/agencies`, { params }), "기관 목록을 불러오지 못했습니다.");
}

export async function createQualificationReviewAgency(
  requestBody: QualificationReviewAgencyUpsertRequest,
): Promise<QualificationReviewAgencyRecord> {
  return apiRequest(apiClient.post(`${BASE_URL}/agencies`, requestBody), "기관을 저장하지 못했습니다.");
}

export async function updateQualificationReviewAgency(
  id: number,
  requestBody: QualificationReviewAgencyUpsertRequest,
): Promise<QualificationReviewAgencyRecord> {
  return apiRequest(apiClient.put(`${BASE_URL}/agencies/${id}`, requestBody), "기관을 저장하지 못했습니다.");
}

export async function deleteQualificationReviewAgency(id: number): Promise<void> {
  await apiRequest(apiClient.delete(`${BASE_URL}/agencies/${id}`), "기관을 삭제하지 못했습니다.");
}

export async function listQualificationReviewCriteria(
  agencyId: number,
  params: QualificationCriteriaSearchParams = {},
): Promise<QualificationReviewCriterionRecord[]> {
  return apiRequest(apiClient.get(`${BASE_URL}/criteria`, { params: { ...params, agencyId } }), "시행기준 목록을 불러오지 못했습니다.");
}

export async function createQualificationReviewCriterion(
  requestBody: QualificationReviewCriterionUpsertRequest,
): Promise<QualificationReviewCriterionRecord> {
  return apiRequest(apiClient.post(`${BASE_URL}/criteria`, requestBody), "시행기준을 저장하지 못했습니다.");
}

export async function updateQualificationReviewCriterion(
  id: number,
  requestBody: QualificationReviewCriterionUpsertRequest,
): Promise<QualificationReviewCriterionRecord> {
  return apiRequest(apiClient.put(`${BASE_URL}/criteria/${id}`, requestBody), "시행기준을 저장하지 못했습니다.");
}

export async function deleteQualificationReviewCriterion(id: number): Promise<void> {
  await apiRequest(apiClient.delete(`${BASE_URL}/criteria/${id}`), "시행기준을 삭제하지 못했습니다.");
}

export async function listQualificationScoreBands(criterionId: number): Promise<QualificationScoreBandRecord[]> {
  return apiRequest(apiClient.get(`${BASE_URL}/score-bands`, { params: { criterionId } }), "가격구간 목록을 불러오지 못했습니다.");
}

export async function createQualificationScoreBand(
  requestBody: QualificationScoreBandUpsertRequest,
): Promise<QualificationScoreBandRecord> {
  return apiRequest(apiClient.post(`${BASE_URL}/score-bands`, requestBody), "가격구간을 저장하지 못했습니다.");
}

export async function updateQualificationScoreBand(
  id: number,
  requestBody: QualificationScoreBandUpsertRequest,
): Promise<QualificationScoreBandRecord> {
  return apiRequest(apiClient.put(`${BASE_URL}/score-bands/${id}`, requestBody), "가격구간을 저장하지 못했습니다.");
}

export async function deleteQualificationScoreBand(id: number): Promise<void> {
  await apiRequest(apiClient.delete(`${BASE_URL}/score-bands/${id}`), "가격구간을 삭제하지 못했습니다.");
}
