export type ReminderStatus = "DRAFT" | "FAILED" | "PAUSED" | "SCHEDULED" | "SENT";
export type SendChannel = "LMS" | "SMS";

export type MessageTemplate = {
  id: number;
  active: boolean;
  channel: SendChannel;
  description: string;
  name: string;
  title: string;
  content: string;
  updatedAt: string;
};

export type EducationReminderTarget = {
  id: number;
  active: boolean;
  channel: SendChannel;
  departmentName: string;
  dueDate: string;
  educationName: string;
  engineerName: string;
  failedAt: string | null;
  failureReason: string | null;
  lastSentAt: string | null;
  managerName: string;
  phoneNumber: string;
  reminderDaysBefore: number;
  retryCount: number;
  sendPlanDate: string;
  status: ReminderStatus;
  templateId: number;
};

export type SendHistoryRow = {
  id: number;
  channel: SendChannel;
  departmentName: string;
  engineerName: string;
  failureReason: string | null;
  messageContent: string;
  phoneNumber: string;
  sentAt: string;
  status: "FAILED" | "SUCCESS";
  targetId: number;
  templateName: string;
};

export type EducationCompletionStatus = "COMPLETE" | "INCOMPLETE" | "OVERDUE";

export type EducationCompletionRecord = {
  completionDate: string | null;
  completed: boolean;
  departmentName: string;
  dueDate: string;
  educationName: string;
  engineerName: string;
  id: number;
  lastCheckedAt: string;
  managerName: string;
  note: string;
  phoneNumber: string;
  targetId: number | null;
};

export type EducationRequirementCycleUnit = "개월" | "년";

export type EducationRequirementRecord = {
  active: boolean;
  code: string;
  description: string;
  id: number;
  name: string;
  cycleUnit: EducationRequirementCycleUnit;
  cycleValue: number;
  updatedAt: string;
};

export const defaultTemplateContent =
  "[제일엔지니어링] {이름}님, {교육명} 이수 마감일이 {마감일}입니다. 기한 내 교육을 이수해 주시기 바랍니다.";

export const today = () => new Date().toISOString().slice(0, 10);
export const nowText = () => new Date().toISOString().slice(0, 16).replace("T", " ");

export const text = (value: string | null | undefined) => value ?? "";
export const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
export const numberValue = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));
export const normalizeNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const daysUntil = (date: string) => {
  const due = new Date(`${date}T00:00:00`).getTime();
  const base = new Date(`${today()}T00:00:00`).getTime();
  return Math.ceil((due - base) / 86_400_000);
};

export const statusLabel: Record<ReminderStatus, string> = {
  DRAFT: "작성중",
  FAILED: "실패",
  PAUSED: "중지",
  SCHEDULED: "예약",
  SENT: "완료",
};

export const statusColor: Record<ReminderStatus, "default" | "error" | "info" | "success" | "warning"> = {
  DRAFT: "default",
  FAILED: "error",
  PAUSED: "warning",
  SCHEDULED: "info",
  SENT: "success",
};

export const completionStatusLabel: Record<EducationCompletionStatus, string> = {
  COMPLETE: "이수완료",
  INCOMPLETE: "미이수",
  OVERDUE: "기한초과",
};

export const completionStatusColor: Record<EducationCompletionStatus, "default" | "error" | "success" | "warning"> = {
  COMPLETE: "success",
  INCOMPLETE: "default",
  OVERDUE: "error",
};

export const renderDueLabel = (dueDate: string) => {
  const days = daysUntil(dueDate);
  if (days < 0) {
    return `${Math.abs(days)}일 경과`;
  }
  return `${days}일 남음`;
};

export const fillTemplate = (content: string, target: EducationReminderTarget) =>
  content
    .replaceAll("{이름}", target.engineerName || "홍길동")
    .replaceAll("{부서}", target.departmentName || "부서명")
    .replaceAll("{교육명}", target.educationName || "교육명")
    .replaceAll("{마감일}", target.dueDate || "YYYY-MM-DD")
    .replaceAll("{남은일수}", String(Math.max(0, daysUntil(target.dueDate))));

export const emptyTemplate = (): MessageTemplate => ({
  id: 0,
  active: true,
  channel: "LMS",
  description: "",
  name: "",
  title: "",
  content: defaultTemplateContent,
  updatedAt: "",
});

export const emptyTarget = (templateId = 1): EducationReminderTarget => ({
  id: 0,
  active: true,
  channel: "LMS",
  departmentName: "",
  dueDate: today(),
  educationName: "건설사업관리 계속교육",
  engineerName: "",
  failedAt: null,
  failureReason: null,
  lastSentAt: null,
  managerName: "",
  phoneNumber: "",
  reminderDaysBefore: 14,
  retryCount: 1,
  sendPlanDate: today(),
  status: "DRAFT",
  templateId,
});

export const initialTemplates: MessageTemplate[] = [
  {
    id: 1,
    active: true,
    channel: "LMS",
    description: "건설사업관리 계속교육 대상자 기본 안내",
    name: "건설사업관리 계속교육 안내",
    title: "건설사업관리 계속교육 이수 안내",
    content: defaultTemplateContent,
    updatedAt: "2026-08-11 09:00",
  },
  {
    id: 2,
    active: true,
    channel: "LMS",
    description: "설계시공 계속교육 임박 대상 재안내",
    name: "설계시공 계속교육 임박 안내",
    title: "설계시공 계속교육 마감 임박",
    content:
      "[제일엔지니어링] {이름}님, {교육명} 이수 마감이 {남은일수}일 남았습니다. 마감일 {마감일} 전까지 이수 바랍니다.",
    updatedAt: "2026-08-11 09:10",
  },
  {
    id: 3,
    active: false,
    channel: "SMS",
    description: "휴대폰 번호 미확보 대상자용 단문",
    name: "휴대폰 단문 재안내",
    title: "법정교육 안내",
    content: "{이름}님, {교육명} 이수 마감일은 {마감일}입니다.",
    updatedAt: "2026-08-10 15:20",
  },
  {
    id: 4,
    active: true,
    channel: "SMS",
    description: "기한 경과 대상 즉시 재안내",
    name: "기한초과 즉시 안내",
    title: "법정 필수교육 기한초과",
    content: "{이름}님, {교육명} 이수 마감일이 지났습니다. 즉시 확인이 필요합니다.",
    updatedAt: "2026-08-11 09:20",
  },
];

export const initialTargets: EducationReminderTarget[] = [
  {
    id: 1,
    active: true,
    channel: "LMS",
    departmentName: "영업전략실",
    dueDate: "2026-11-03",
    educationName: "건설사업관리 계속교육",
    engineerName: "고용석",
    failedAt: null,
    failureReason: null,
    lastSentAt: "2026-08-11 09:05",
    managerName: "관리팀",
    phoneNumber: "010-2624-8996",
    reminderDaysBefore: 30,
    retryCount: 1,
    sendPlanDate: "2026-10-04",
    status: "SCHEDULED",
    templateId: 1,
  },
  {
    id: 2,
    active: true,
    channel: "LMS",
    departmentName: "SHE경영실",
    dueDate: "2026-12-22",
    educationName: "설계시공 계속교육",
    engineerName: "정병구",
    failedAt: null,
    failureReason: null,
    lastSentAt: null,
    managerName: "교육관리팀",
    phoneNumber: "010-2208-8156",
    reminderDaysBefore: 45,
    retryCount: 2,
    sendPlanDate: "2026-11-07",
    status: "SCHEDULED",
    templateId: 2,
  },
  {
    id: 3,
    active: true,
    channel: "SMS",
    departmentName: "도로사업부",
    dueDate: "2026-02-05",
    educationName: "설계시공 계속교육",
    engineerName: "문동렬",
    failedAt: null,
    failureReason: "파견 중 전화 연결 어려움",
    lastSentAt: "2026-08-08 09:40",
    managerName: "교육관리팀",
    phoneNumber: "010-3681-4715",
    reminderDaysBefore: 7,
    retryCount: 1,
    sendPlanDate: "2026-08-09",
    status: "FAILED",
    templateId: 4,
  },
  {
    id: 4,
    active: true,
    channel: "LMS",
    departmentName: "철도사업부",
    dueDate: "2027-12-31",
    educationName: "건설사업관리 계속교육",
    engineerName: "최영학",
    failedAt: null,
    failureReason: null,
    lastSentAt: "2026-08-10 11:15",
    managerName: "교육관리팀",
    phoneNumber: "",
    reminderDaysBefore: 60,
    retryCount: 0,
    sendPlanDate: "2026-08-15",
    status: "SENT",
    templateId: 1,
  },
  {
    id: 5,
    active: true,
    channel: "LMS",
    departmentName: "도로사업부",
    dueDate: "2026-08-27",
    educationName: "건설사업관리 계속교육",
    engineerName: "곽기호",
    failedAt: null,
    failureReason: null,
    lastSentAt: null,
    managerName: "교육관리팀",
    phoneNumber: "",
    reminderDaysBefore: 14,
    retryCount: 1,
    sendPlanDate: "2026-08-11",
    status: "SCHEDULED",
    templateId: 1,
  },
  {
    id: 6,
    active: false,
    channel: "SMS",
    departmentName: "상하수도사업부",
    dueDate: "2026-07-05",
    educationName: "설계시공 계속교육",
    engineerName: "박병국",
    failedAt: null,
    failureReason: null,
    lastSentAt: "2026-07-04 10:20",
    managerName: "교육관리팀",
    phoneNumber: "",
    reminderDaysBefore: 3,
    retryCount: 0,
    sendPlanDate: "2026-06-30",
    status: "PAUSED",
    templateId: 3,
  },
  {
    id: 7,
    active: true,
    channel: "LMS",
    departmentName: "지반사업부",
    dueDate: "2026-03-11",
    educationName: "설계시공 계속교육",
    engineerName: "김성호",
    failedAt: "2026-08-09 09:10",
    failureReason: "기한초과, 즉시 재안내 필요",
    lastSentAt: null,
    managerName: "교육관리팀",
    phoneNumber: "010-7421-8812",
    reminderDaysBefore: 7,
    retryCount: 2,
    sendPlanDate: "2026-08-09",
    status: "FAILED",
    templateId: 4,
  },
  {
    id: 8,
    active: true,
    channel: "LMS",
    departmentName: "단지사업부",
    dueDate: "2026-11-18",
    educationName: "건설사업관리 계속교육",
    engineerName: "김진회",
    failedAt: null,
    failureReason: null,
    lastSentAt: null,
    managerName: "교육관리팀",
    phoneNumber: "010-5243-3014",
    reminderDaysBefore: 21,
    retryCount: 1,
    sendPlanDate: "2026-10-28",
    status: "DRAFT",
    templateId: 2,
  },
];

export const initialHistoryRows: SendHistoryRow[] = [
  {
    id: 1,
    channel: "LMS",
    departmentName: "영업전략실",
    engineerName: "고용석",
    failureReason: null,
    messageContent: "[제일엔지니어링] 고용석님, 건설사업관리 계속교육 이수 마감이 84일 남았습니다.",
    phoneNumber: "010-2624-8996",
    sentAt: "2026-08-11 09:05",
    status: "SUCCESS",
    targetId: 1,
    templateName: "건설사업관리 계속교육 안내",
  },
  {
    id: 2,
    channel: "LMS",
    departmentName: "SHE경영실",
    engineerName: "정병구",
    failureReason: null,
    messageContent: "[제일엔지니어링] 정병구님, 설계시공 계속교육 이수 마감이 133일 남았습니다.",
    phoneNumber: "010-2208-8156",
    sentAt: "2026-08-11 09:10",
    status: "SUCCESS",
    targetId: 2,
    templateName: "설계시공 계속교육 임박 안내",
  },
  {
    id: 3,
    channel: "SMS",
    departmentName: "도로사업부",
    engineerName: "문동렬",
    failureReason: "파견 중 전화 연결 어려움",
    messageContent:
      "[제일엔지니어링] 문동렬님, 설계시공 계속교육 이수 마감이 지났습니다. 즉시 확인이 필요합니다.",
    phoneNumber: "010-3681-4715",
    sentAt: "2026-08-08 09:40",
    status: "FAILED",
    targetId: 3,
    templateName: "기한초과 즉시 안내",
  },
  {
    id: 4,
    channel: "LMS",
    departmentName: "철도사업부",
    engineerName: "최영학",
    failureReason: null,
    messageContent: "[제일엔지니어링] 최영학님, 건설사업관리 계속교육 이수 마감이 507일 남았습니다.",
    phoneNumber: "",
    sentAt: "2026-08-10 11:15",
    status: "SUCCESS",
    targetId: 4,
    templateName: "건설사업관리 계속교육 안내",
  },
  {
    id: 5,
    channel: "LMS",
    departmentName: "도로사업부",
    engineerName: "곽기호",
    failureReason: null,
    messageContent: "[제일엔지니어링] 곽기호님, 건설사업관리 계속교육 마감 예정입니다.",
    phoneNumber: "",
    sentAt: "2026-08-11 08:30",
    status: "FAILED",
    targetId: 5,
    templateName: "건설사업관리 계속교육 안내",
  },
  {
    id: 6,
    channel: "LMS",
    departmentName: "지반사업부",
    engineerName: "김성호",
    failureReason: "기한초과, 즉시 재안내 필요",
    messageContent: "[제일엔지니어링] 김성호님, 설계시공 계속교육 이수 마감일이 지났습니다.",
    phoneNumber: "010-7421-8812",
    sentAt: "2026-08-09 09:10",
    status: "FAILED",
    targetId: 7,
    templateName: "기한초과 즉시 안내",
  },
];

export const initialCompletionRows: EducationCompletionRecord[] = [
  {
    completionDate: "2026-02-05",
    completed: true,
    departmentName: "도로사업부",
    dueDate: "2026-02-05",
    educationName: "설계시공 계속교육",
    engineerName: "문동렬",
    id: 1,
    lastCheckedAt: "2026-08-11 09:20",
    managerName: "교육관리팀",
    note: "방글라대시 파견 중, 별도 확인 필요",
    phoneNumber: "010-3681-4715",
    targetId: 3,
  },
  {
    completionDate: null,
    completed: false,
    departmentName: "도로사업부",
    dueDate: "2026-08-27",
    educationName: "건설사업관리 계속교육",
    engineerName: "곽기호",
    id: 2,
    lastCheckedAt: "2026-08-10 17:10",
    managerName: "교육관리팀",
    note: "8/28 교육 시작 예정",
    phoneNumber: "",
    targetId: 5,
  },
  {
    completionDate: "2026-07-05",
    completed: true,
    departmentName: "상하수도사업부",
    dueDate: "2026-07-05",
    educationName: "설계시공 계속교육",
    engineerName: "박병국",
    id: 3,
    lastCheckedAt: "2026-08-11 08:50",
    managerName: "교육관리팀",
    note: "설계시공 계속교육 신청완료",
    phoneNumber: "",
    targetId: 6,
  },
  {
    completionDate: "2026-03-11",
    completed: true,
    departmentName: "지반사업부",
    dueDate: "2026-03-11",
    educationName: "설계시공 계속교육",
    engineerName: "김성호",
    id: 4,
    lastCheckedAt: "2026-08-09 09:10",
    managerName: "교육관리팀",
    note: "기한초과 재안내 완료",
    phoneNumber: "010-7421-8812",
    targetId: 7,
  },
  {
    completionDate: null,
    completed: false,
    departmentName: "단지사업부",
    dueDate: "2026-11-18",
    educationName: "건설사업관리 계속교육",
    engineerName: "김진회",
    id: 5,
    lastCheckedAt: "2026-08-11 09:40",
    managerName: "교육관리팀",
    note: "금일 확인 예정",
    phoneNumber: "010-5243-3014",
    targetId: 8,
  },
  {
    completionDate: null,
    completed: false,
    departmentName: "도로사업부",
    dueDate: "2026-12-22",
    educationName: "설계시공 계속교육",
    engineerName: "정병구",
    id: 6,
    lastCheckedAt: "2026-08-11 09:50",
    managerName: "교육관리팀",
    note: "주기 확인 완료",
    phoneNumber: "010-2208-8156",
    targetId: 2,
  },
  {
    completionDate: null,
    completed: false,
    departmentName: "철도사업부",
    dueDate: "2027-12-31",
    educationName: "건설사업관리 계속교육",
    engineerName: "최영학",
    id: 7,
    lastCheckedAt: "2026-08-11 09:55",
    managerName: "교육관리팀",
    note: "해외 프로젝트 계약직",
    phoneNumber: "",
    targetId: 4,
  },
  {
    completionDate: null,
    completed: false,
    departmentName: "영업전략실",
    dueDate: "2026-11-03",
    educationName: "건설사업관리 계속교육",
    engineerName: "고용석",
    id: 8,
    lastCheckedAt: "2026-08-11 10:00",
    managerName: "교육관리팀",
    note: "국토부, 철도청 출신",
    phoneNumber: "010-2624-8996",
    targetId: 1,
  },
];

export const initialEducationRequirements: EducationRequirementRecord[] = [
  {
    active: true,
    code: "LAW-CM-001",
    description: "건설사업관리 계속교육 기본 주기",
    id: 1,
    name: "건설사업관리 계속교육",
    cycleUnit: "년",
    cycleValue: 1,
    updatedAt: "2026-08-11 09:00",
  },
  {
    active: true,
    code: "LAW-DS-002",
    description: "설계시공 계속교육 기본 주기",
    id: 2,
    name: "설계시공 계속교육",
    cycleUnit: "개월",
    cycleValue: 12,
    updatedAt: "2026-08-10 16:20",
  },
  {
    active: true,
    code: "LAW-DS-003",
    description: "건설사업관리(고급) 계속교육 주기",
    id: 3,
    name: "건설사업관리(고급) 계속교육",
    cycleUnit: "년",
    cycleValue: 2,
    updatedAt: "2026-08-09 11:30",
  },
  {
    active: true,
    code: "LAW-DS-004",
    description: "설계시공 계속교육 1주 기준",
    id: 4,
    name: "설계시공 계속교육 1주",
    cycleUnit: "년",
    cycleValue: 1,
    updatedAt: "2026-08-09 11:45",
  },
  {
    active: false,
    code: "LAW-SAFE-005",
    description: "건설안전 계속교육 기본 주기",
    id: 5,
    name: "건설안전 계속교육",
    cycleUnit: "년",
    cycleValue: 1,
    updatedAt: "2026-08-08 14:10",
  },
];
