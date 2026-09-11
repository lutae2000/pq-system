import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";
import type { EngineerProfile, EngineerSummary } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

export type BackendEngineerBasic = {
  birthday: string | null;
  educationException: boolean | null;
  deptName: string | null;
  dutyPart: string | null;
  engrId: string;
  grade: string | null;
  designGrade: string | null;
  constructionManagementGrade: string | null;
  nameKor: string;
  proPart: string | null;
  retireYn: string;
};

export type BackendEngineerLicense = {
  dateOfIssue: string | null;
  engrId: string;
  licenseCode: string | null;
  licenseNo: string | null;
  recordId: number | null;
};

export type BackendEngineerCareer = {
  compName: string | null;
  deptName: string | null;
  engrId: string;
  entryDt: string | null;
  duty: string | null;
  grade: string | null;
  recordId: number | null;
  retireDt: string | null;
};

export type BackendEngineerPrize = {
  dt: string | null;
  engrId: string;
  jobName: string | null;
  kind: string | null;
  organName: string | null;
  prizeTag: string | null;
  recordId: number | null;
  remark: string | null;
  spec: string | null;
};

export type BackendEngineerEducation = {
  eduName: string | null;
  engrId: string;
  endDt: string | null;
  organName: string | null;
  recordId: number | null;
  startDt: string | null;
};

export type BackendEngineerCareerDetail = {
  compName: string | null;
  deptName: string | null;
  duty: string | null;
  engLevel: number | null;
  engrId: string;
  endDt: string | null;
  grade: string | null;
  jobClass: string | null;
  jobName: string | null;
  jobPart: string | null;
  jobTag: string | null;
  joinDay: number | null;
  joinYn: string | null;
  method: string | null;
  partDay: number | null;
  proPart: string | null;
  recordId: number | null;
  remark: string | null;
  returnYn: string | null;
  selectDay: number | null;
  seq: number | null;
  startDt: string | null;
};

export type BackendEngineerSchool = {
  career: number | null;
  engrId: string;
  graduationDate: string | null;
  lastYn: string | null;
  major: string | null;
  recordId: number | null;
  schName: string | null;
  validMajorYn: string | null;
};

export type BackendEngineerProfile = {
  basic: BackendEngineerBasic;
  careerDetails: BackendEngineerCareerDetail[];
  careers: BackendEngineerCareer[];
  educations: BackendEngineerEducation[];
  licenses: BackendEngineerLicense[];
  prizes: BackendEngineerPrize[];
  schools: BackendEngineerSchool[];
};

type BackendEngineerProfilePage = {
  content: BackendEngineerProfile[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

type AttachmentItem = {
  id: string;
  lastModified: number;
  name: string;
  size: number;
  type: string;
  url: string;
};

type EngineerProfileView = EngineerProfile;

export type EngineerProfileListFilters = {
  certificationName?: string;
  department?: string;
  designGrade?: string;
  jobField?: string;
  keyword?: string;
  retireYn?: "Y" | "N";
  specialtyField?: string;
  status?: string;
  constructionManagementGrade?: string;
};

const emptyArray = <T,>() => [] as T[];

const text = (value: string | null | undefined) => value ?? "";

function formatDisplayDate(value: string | null | undefined) {
  const normalized = text(value);
  if (!normalized) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  if (/^\d{8}$/.test(normalized)) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  return normalized;
}

function formatYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function parseDateParts(value: string | null | undefined) {
  const normalized = text(value).replace(/-/g, "");
  if (!/^\d{8}$/.test(normalized)) {
    return null;
  }

  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));
  const day = Number(normalized.slice(6, 8));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function diffYmd(startValue: string | null | undefined, endValue: string | null | undefined) {
  const start = parseDateParts(startValue);
  const end = parseDateParts(endValue);
  if (!start || !end || end.getTime() < start.getTime()) {
    return { days: 0, months: 0, years: 0 };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { days, months, years };
}

function ageFromBirth(birthday: string | null | undefined) {
  const birth = parseDateParts(birthday);
  if (!birth) {
    return 0;
  }

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const dayDiff = now.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function awardCategoryLabel(tag: string | null | undefined) {
  switch (text(tag)) {
    case "1":
      return "상훈";
    case "2":
      return "제재";
    default:
      return text(tag);
  }
}

function mapSummary(basic: BackendEngineerBasic): EngineerSummary {
  const retired = basic.retireYn === "Y";
  return {
    active: !retired,
    assessmentDate: formatDisplayDate(basic.birthday),
    assessmentMethod: "자체평정",
    department: text(basic.deptName),
    id: basic.engrId,
    name: basic.nameKor,
    position: text(basic.grade),
    rrn: "",
    status: retired ? "퇴직" : "재직",
    workField: text(basic.dutyPart),
    specialtyField: text(basic.proPart),
  };
}

function mapDetail(profile: BackendEngineerProfile) {
  const certificationCount = profile.licenses.length;
  const participationDays = profile.careerDetails.reduce((sum, item) => sum + (item.selectDay ?? item.partDay ?? 0), 0);
  const latestSchool = profile.schools[0];

  return {
    address: "",
    age: ageFromBirth(profile.basic.birthday),
    birthDate: formatDisplayDate(profile.basic.birthday),
    certificationCount: String(certificationCount),
    educationException: Boolean(profile.basic.educationException),
    educationGrade: text(profile.basic.grade),
    educationLevel: latestSchool?.career != null ? String(latestSchool.career) : "",
    hometown: "",
    jobField: text(profile.basic.dutyPart),
    participationDays,
    retired: profile.basic.retireYn === "Y",
    designScore: "0.00",
    qualificationGrade: text(profile.basic.grade),
    supervisionScore: "0.00",
    supervisionEducation: text(profile.basic.proPart),
    supervisionQualification: text(profile.basic.constructionManagementGrade),
    specialtyField: text(profile.basic.proPart),
    technicalField: text(profile.basic.designGrade),
    title: text(profile.basic.grade),
  };
}

function mapCareer(item: BackendEngineerCareer, index: number, retired: boolean) {
  const effectiveEndDate = item.retireDt || (!retired ? formatYmd(new Date()) : "");
  const duration = diffYmd(item.entryDt, effectiveEndDate);
  return {
    attachments: emptyArray<AttachmentItem>(),
    company: text(item.compName),
    days: duration.days,
    department: text(item.deptName),
    endDate: formatDisplayDate(item.retireDt),
    id: item.recordId != null ? String(item.recordId) : `C-${String(index + 1).padStart(3, "0")}`,
    jobDuty: text(item.duty),
    month: duration.months,
    position: text(item.grade),
    startDate: formatDisplayDate(item.entryDt),
    year: duration.years,
  };
}

function mapCertificate(item: BackendEngineerLicense, index: number) {
  return {
    active: true,
    attachments: emptyArray<AttachmentItem>(),
    certificateName: text(item.licenseCode),
    expiryDate: "",
    id: item.recordId != null ? String(item.recordId) : `LC-${String(index + 1).padStart(3, "0")}`,
    issueDate: formatDisplayDate(item.dateOfIssue),
    level: "",
    licenseNo: text(item.licenseNo),
  };
}

function mapAward(item: BackendEngineerPrize, index: number) {
  return {
    active: true,
    agency: text(item.organName),
    attachments: emptyArray<AttachmentItem>(),
    basis: text(item.spec),
    businessName: text(item.jobName),
    category: awardCategoryLabel(item.prizeTag),
    id: item.recordId != null ? String(item.recordId) : `AW-${String(index + 1).padStart(3, "0")}`,
    issueDate: formatDisplayDate(item.dt),
    kind: text(item.kind),
    remark: text(item.remark),
  };
}

function mapTraining(item: BackendEngineerEducation, index: number) {
  return {
    active: true,
    attachments: emptyArray<AttachmentItem>(),
    endDate: formatDisplayDate(item.endDt),
    hours: 0,
    id: item.recordId != null ? String(item.recordId) : `TR-${String(index + 1).padStart(3, "0")}`,
    institution: text(item.organName),
    startDate: formatDisplayDate(item.startDt),
    trainingName: text(item.eduName),
  };
}

function mapProfile(profile: BackendEngineerProfile): EngineerProfileView {
  return {
    awards: profile.prizes.map(mapAward),
    certificates: profile.licenses.map(mapCertificate),
    career: profile.careers.map((item, index) => mapCareer(item, index, profile.basic.retireYn === "Y")),
    careerDetails: profile.careerDetails.map((item) => ({
      active: true,
      attachments: emptyArray<AttachmentItem>(),
      compName: text(item.compName),
      deptName: text(item.deptName),
      duty: text(item.duty),
      engLevel: item.engLevel ?? 0,
      endDate: text(item.endDt),
      grade: text(item.grade),
      id: item.recordId != null ? String(item.recordId) : `PC-${String(item.seq ?? 0).padStart(3, "0")}`,
      jobClass: text(item.jobClass),
      jobName: text(item.jobName),
      jobPart: text(item.jobPart),
      jobTag: text(item.jobTag),
      joinDay: item.joinDay ?? 0,
      joinYn: text(item.joinYn),
      method: text(item.method),
      partDay: item.partDay ?? 0,
      proPart: text(item.proPart),
      recordId: item.recordId,
      remark: text(item.remark),
      returnYn: text(item.returnYn),
      selectDay: item.selectDay ?? 0,
      seq: item.seq ?? 0,
      startDate: text(item.startDt),
    })),
    detail: mapDetail(profile),
    education: profile.schools.map((item, index) => ({
      active: true,
      attachments: emptyArray<AttachmentItem>(),
      degree: item.career != null ? String(item.career) : "",
      endDate: formatDisplayDate(item.graduationDate),
      id: item.recordId != null ? String(item.recordId) : `SC-${String(index + 1).padStart(3, "0")}`,
      major: text(item.major),
      schoolName: text(item.schName),
      startDate: "",
      validMajorYn: text(item.validMajorYn).toUpperCase() === "Y" ? "Y" : "N",
    })),
    schools: profile.schools.map((item, index) => ({
      active: true,
      attachments: emptyArray<AttachmentItem>(),
      career: item.career ?? 0,
      graduationDate: formatDisplayDate(item.graduationDate),
      id: item.recordId != null ? String(item.recordId) : `SC-${String(index + 1).padStart(3, "0")}`,
      lastYn: text(item.lastYn),
      major: text(item.major),
      schName: text(item.schName),
      validMajorYn: text(item.validMajorYn).toUpperCase() === "Y" ? "Y" : "N",
    })),
    trainings: profile.educations.map(mapTraining),
    summary: mapSummary(profile.basic),
  };
}

function mapProfileToRequest(profile: EngineerProfileView) {
  const summary = profile.summary ?? {};
  return {
    basic: {
      birthday: profile.detail?.birthDate || null,
      constructionManagementGrade: profile.detail?.supervisionQualification || null,
      deptName: summary.department || null,
      designGrade: profile.detail?.technicalField || null,
      dutyPart: summary.workField || null,
      educationException: Boolean(profile.detail?.educationException),
      engrId: summary.id,
      grade: summary.position || null,
      nameKor: summary.name || "",
      proPart: profile.detail?.specialtyField || null,
      retireYn: profile.detail?.retired ? "Y" : "N",
    },
    careerDetails: profile.careerDetails ?? [],
    careers: profile.career ?? [],
    educations: profile.trainings ?? [],
    licenses: profile.certificates ?? [],
    prizes: profile.awards ?? [],
    schools: profile.education ?? [],
  };
}

function numericRecordId(id: unknown) {
  const value = String(id ?? "");
  return /^\d+$/.test(value) ? Number(value) : null;
}

function normalizeRequestDate(value: unknown) {
  const normalized = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  return normalized || null;
}

function mapCareerRowsToRequest(engrId: string, rows: EngineerProfileView["career"]): BackendEngineerCareer[] {
  return (rows ?? []).map((row) => ({
    compName: row.company || null,
    deptName: row.department || null,
    engrId,
    entryDt: normalizeRequestDate(row.startDate),
    grade: row.position || null,
    duty: row.jobDuty || null,
    recordId: numericRecordId(row.id),
    retireDt: normalizeRequestDate(row.endDate),
  }));
}

function mapLicenseRowsToRequest(engrId: string, rows: EngineerProfileView["certificates"]): BackendEngineerLicense[] {
  return (rows ?? []).map((row) => ({
    dateOfIssue: normalizeRequestDate(row.issueDate),
    engrId,
    licenseCode: row.certificateName || null,
    licenseNo: row.licenseNo || null,
    recordId: numericRecordId(row.id),
  }));
}

function mapPrizeRowsToRequest(engrId: string, rows: EngineerProfileView["awards"]): BackendEngineerPrize[] {
  return (rows ?? []).map((row) => ({
    dt: normalizeRequestDate(row.issueDate),
    engrId,
    jobName: row.businessName || null,
    kind: row.kind || null,
    organName: row.agency || null,
    prizeTag: row.category || null,
    recordId: numericRecordId(row.id),
    remark: row.remark || null,
    spec: row.basis || null,
  }));
}

function mapEducationRowsToRequest(engrId: string, rows: EngineerProfileView["trainings"]): BackendEngineerEducation[] {
  return (rows ?? []).map((row) => ({
    eduName: row.trainingName || null,
    engrId,
    endDt: normalizeRequestDate(row.endDate),
    organName: row.institution || null,
    recordId: numericRecordId(row.id),
    startDt: normalizeRequestDate(row.startDate),
  }));
}

function mapSchoolRowsToRequest(engrId: string, rows: EngineerProfileView["education"]): BackendEngineerSchool[] {
  return (rows ?? []).map((row) => ({
    career: Number(row.degree) || null,
    engrId,
    graduationDate: normalizeRequestDate(row.endDate),
    lastYn: null,
    major: row.major || null,
    recordId: numericRecordId(row.id),
    schName: row.schoolName || null,
    validMajorYn: row.validMajorYn === "Y" ? "Y" : "N",
  }));
}

export async function listEngineerProfiles(filters: EngineerProfileListFilters = {}): Promise<EngineerProfileView[]> {
  const pageSize = 1000;
  const requestPage = (page: number) =>
    apiRequest<BackendEngineerProfilePage>(
      apiClient.get("/pq/engineers", { params: { page, size: pageSize, ...filters } }),
      "Failed to load engineer profiles.",
    );

  const firstPage = await requestPage(0);
  const profiles = [...(firstPage.content ?? [])];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await requestPage(page);
    profiles.push(...(nextPage.content ?? []));
  }

  return profiles.map(mapProfile);
}

export async function getEngineerProfile(engrId: string): Promise<EngineerProfileView> {
  const profile = await apiRequest<BackendEngineerProfile>(
    apiClient.get(`/pq/engineers/${encodeURIComponent(engrId)}`),
    "Failed to load the engineer profile.",
  );
  return mapProfile(profile);
}

export async function listSelectedEngineerProfilesForBidNotice(params: {
  bidSeq: number;
  workDutyId?: string;
  keyword?: string;
}): Promise<EngineerProfileView[]> {
  const profiles = await apiRequest<BackendEngineerProfile[]>(
    apiClient.get("/pq/participating-engineers/profiles", {
      params: {
        bidSeq: params.bidSeq,
        workDutyId: params.workDutyId?.trim() || undefined,
        keyword: params.keyword?.trim() || undefined,
      },
    }),
    "선정 기술인 목록을 불러오지 못했습니다.",
  );
  return profiles.map(mapProfile);
}

export async function listSelectedEngineerProfileSummariesForBidNotice(params: {
  bidSeq: number;
  workDutyId?: string;
  keyword?: string;
}): Promise<EngineerProfileView[]> {
  const profiles = await apiRequest<BackendEngineerProfile[]>(
    apiClient.get("/pq/participating-engineers/profiles/summary", {
      params: {
        bidSeq: params.bidSeq,
        workDutyId: params.workDutyId?.trim() || undefined,
        keyword: params.keyword?.trim() || undefined,
      },
    }),
    "선정 기술인 요약 목록을 불러오지 못했습니다.",
  );
  return profiles.map(mapProfile);
}

export async function saveEngineerProfile(profile: EngineerProfileView): Promise<EngineerProfileView> {
  return saveEngineerMaster(profile.summary.id, profile);
}

export async function saveEngineerMaster(engrId: string, profile: EngineerProfileView): Promise<EngineerProfileView> {
  const requestBody = mapProfileToRequest(profile);
  const saved = profile.summary?.isNew
    ? await apiRequest<BackendEngineerProfile>(apiClient.post("/pq/engineers", requestBody), "Failed to save engineer profile.")
    : await apiRequest<BackendEngineerProfile>(
        apiClient.put(`/pq/engineers/${encodeURIComponent(engrId)}/master`, requestBody.basic),
        "Failed to save engineer profile.",
      );
  return mapProfile(saved);
}

export async function saveEngineerLicenses(engrId: string, certificates: EngineerProfileView["certificates"]): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.put(`/pq/engineers/${encodeURIComponent(engrId)}/licenses`, mapLicenseRowsToRequest(engrId, certificates)),
    "Failed to save engineer profile.",
  );
  return mapProfile(saved);
}

export async function saveEngineerCareers(engrId: string, careers: EngineerProfileView["career"]): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.put(`/pq/engineers/${encodeURIComponent(engrId)}/careers`, mapCareerRowsToRequest(engrId, careers)),
    "Failed to save engineer profile.",
  );
  return mapProfile(saved);
}

export async function saveEngineerPrizes(engrId: string, awards: EngineerProfileView["awards"]): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.put(`/pq/engineers/${encodeURIComponent(engrId)}/prizes`, mapPrizeRowsToRequest(engrId, awards)),
    "Failed to save engineer profile.",
  );
  return mapProfile(saved);
}

export async function saveEngineerEducations(engrId: string, trainings: EngineerProfileView["trainings"]): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.put(`/pq/engineers/${encodeURIComponent(engrId)}/educations`, mapEducationRowsToRequest(engrId, trainings)),
    "Failed to save engineer profile.",
  );
  return mapProfile(saved);
}

export async function saveEngineerSchools(engrId: string, educations: EngineerProfileView["education"]): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.put(`/pq/engineers/${encodeURIComponent(engrId)}/schools`, mapSchoolRowsToRequest(engrId, educations)),
    "Failed to save engineer profile.",
  );
  return mapProfile(saved);
}

export async function deleteEngineerLicense(engrId: string, recordId: string): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.delete(`/pq/engineers/${encodeURIComponent(engrId)}/licenses/${encodeURIComponent(recordId)}`),
    "Failed to delete engineer profile.",
  );
  return mapProfile(saved);
}

export async function deleteEngineerCareer(engrId: string, recordId: string): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.delete(`/pq/engineers/${encodeURIComponent(engrId)}/careers/${encodeURIComponent(recordId)}`),
    "Failed to delete engineer profile.",
  );
  return mapProfile(saved);
}

export async function deleteEngineerPrize(engrId: string, recordId: string): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.delete(`/pq/engineers/${encodeURIComponent(engrId)}/prizes/${encodeURIComponent(recordId)}`),
    "Failed to delete engineer profile.",
  );
  return mapProfile(saved);
}

export async function deleteEngineerEducation(engrId: string, recordId: string): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.delete(`/pq/engineers/${encodeURIComponent(engrId)}/educations/${encodeURIComponent(recordId)}`),
    "Failed to delete engineer profile.",
  );
  return mapProfile(saved);
}

export async function deleteEngineerSchool(engrId: string, recordId: string): Promise<EngineerProfileView> {
  const saved = await apiRequest<BackendEngineerProfile>(
    apiClient.delete(`/pq/engineers/${encodeURIComponent(engrId)}/schools/${encodeURIComponent(recordId)}`),
    "Failed to delete engineer profile.",
  );
  return mapProfile(saved);
}

export async function deleteEngineerProfile(engrId: string): Promise<void> {
  await apiRequest(apiClient.delete(`/pq/engineers/${encodeURIComponent(engrId)}`), "Failed to delete engineer profile.");
}

export function mapBackendEngineerProfile(profile: BackendEngineerProfile): EngineerProfileView {
  return mapProfile(profile);
}
