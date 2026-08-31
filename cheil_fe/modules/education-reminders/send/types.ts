import type { EducationReminderChannel, EducationReminderNotificationTargetRecord, EducationReminderTemplateRecord } from "../types";

export const getClosestEducationDeadline = (values: string[]) => {
  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dates = values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));

  return dates.sort((left, right) => {
    const leftTime = Date.parse(`${left}T00:00:00`);
    const rightTime = Date.parse(`${right}T00:00:00`);
    return Math.abs(leftTime - todayTime) - Math.abs(rightTime - todayTime) || left.localeCompare(right);
  })[0] ?? "";
};

export type EducationReminderSendRequest = {
  manualChannel?: EducationReminderChannel;
  manualContent?: string;
  targetRowKeys: string[];
  templateId?: number;
  testPhoneNo?: string;
  testSend: boolean;
};

export type EducationReminderSendResponse = {
  batchId: number;
  channel: EducationReminderChannel;
  insertedCount: number;
  previewMessage: string;
  targetCount: number;
  templateName: string;
  testSend: boolean;
};

export type EducationReminderSendHistoryRecord = {
  actualPhoneNo: string;
  batchId: number;
  channel: EducationReminderChannel;
  departmentName: string;
  engineerName: string;
  failureReason: string | null;
  logId: number;
  messageContent: string;
  requestedAt: string;
  requestedBy: string;
  sentAt: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  targetPhoneNo: string;
  templateName: string;
  testSend: boolean;
};

export type EducationReminderSendRetryRequest = {
  items: Array<{
    actualPhoneNo: string;
    logId: number;
  }>;
};

export type EducationReminderSendRetryResponse = {
  batchCount: number;
  insertedCount: number;
  requestedCount: number;
};

export type EducationReminderSendDialogTarget = Pick<
  EducationReminderNotificationTargetRecord,
  "department" | "engineerId" | "grade" | "highlightTone" | "name" | "phoneNo" | "rowKey" | "targetEducationNames" | "deadline"
> & {
  scheduledEducation1: string;
  scheduledEducation2: string;
};

export type EducationReminderSendHistoryRetryTarget = Pick<
  EducationReminderSendHistoryRecord,
  "actualPhoneNo" | "batchId" | "channel" | "departmentName" | "engineerName" | "failureReason" | "logId" | "messageContent" | "requestedAt" | "requestedBy" | "sentAt" | "status" | "targetPhoneNo" | "templateName" | "testSend"
>;

export type EducationReminderSendTemplate = EducationReminderTemplateRecord;
