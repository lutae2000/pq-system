export type EducationReminderCycleUnit = "MONTH" | "YEAR";
export type EducationReminderChannel = "LMS" | "SMS" | "KAKAO";

export type EducationReminderBasicInfoRecord = {
  active: boolean;
  code: string;
  createdAt: string;
  createdId: string | null;
  cycleUnit: EducationReminderCycleUnit;
  cycleValue: number;
  description: string | null;
  id: number;
  lastChangedAt: string;
  lastChangedId: string | null;
  name: string;
};

export type EducationReminderCompletionRecord = {
  createdAt: string | null;
  createdId: string | null;
  department: string;
  educationCode: string;
  educationName: string;
  highlightTone: "NONE" | "UPCOMING" | "OVERDUE";
  educationRegistered: boolean;
  engineerId: string;
  grade: string;
  hasProfessionalCert: "Y" | "N";
  jobField: string;
  lastChangedAt: string | null;
  lastChangedId: string | null;
  name: string;
  professionalCertNames: string;
  recentEducationStartDate1: string;
  recentEducationStartDate2: string;
  remark: string;
  retireYn: "Y" | "N";
  rowKey: string;
  scheduledEducation1: string;
  scheduledEducation2: string;
  specialtyField: string;
};

export type EducationReminderNotificationTargetRecord = {
  department: string;
  engineerId: string;
  grade: string;
  hasProfessionalCert: "Y" | "N";
  highlightTone: "NONE" | "UPCOMING" | "OVERDUE";
  jobField: string;
  name: string;
  phoneNo: string;
  professionalCertNames: string;
  rowKey: string;
  specialtyField: string;
  targetEducationNames: string;
};

export type EducationReminderCompletionSearchParams = {
  educationRegistered?: boolean;
  jobField?: string;
  name?: string;
  recentEducationStartDate1?: string;
  recentEducationStartDate2?: string;
  retireYn?: "" | "Y" | "N";
  specialtyField?: string;
};

export type EducationReminderCompletionUpsertRequest = {
  educationCode: string;
  educationRegistered: boolean;
  educationStartDate1: string;
  educationStartDate2: string;
  engrId: string;
  remark: string;
};

export type EducationReminderNotificationPhoneUpsertRequest = {
  phoneNo: string;
};

export type EducationReminderTemplateRecord = {
  active: boolean;
  channel: EducationReminderChannel;
  content: string;
  createdAt: string;
  createdId: string | null;
  description: string | null;
  id: number;
  lastChangedAt: string;
  lastChangedId: string | null;
  name: string;
  title: string;
};

export type EducationReminderBasicInfoRequest = {
  active: boolean;
  code: string;
  cycleUnit: EducationReminderCycleUnit;
  cycleValue: number;
  description: string | null;
  id?: number | null;
  name: string;
};

export type EducationReminderTemplateRequest = {
  active: boolean;
  channel: EducationReminderChannel;
  content: string;
  description: string | null;
  id?: number | null;
  name: string;
  title: string;
};

export const cycleUnitLabel: Record<EducationReminderCycleUnit, string> = {
  MONTH: "개월",
  YEAR: "년",
};

export const channelLabel: Record<EducationReminderChannel, string> = {
  LMS: "LMS",
  SMS: "SMS",
  KAKAO: "카카오 알림톡",
};

export const emptyBasicInfo = (): EducationReminderBasicInfoRequest => ({
  active: true,
  code: "",
  cycleUnit: "YEAR",
  cycleValue: 1,
  description: "",
  id: null,
  name: "",
});

export const emptyTemplate = (): EducationReminderTemplateRequest => ({
  active: true,
  channel: "LMS",
  content: "",
  description: "",
  id: null,
  name: "",
  title: "",
});

export const formatDateTime = (value: string | null | undefined) => (value?.trim() ? value : "-");

export const formatDateText = (value: string | null | undefined) => {
  const normalized = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (normalized.length !== 8) {
    return value?.trim() ? value : "-";
  }

  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
};
