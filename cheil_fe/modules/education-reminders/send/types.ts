import type { EducationReminderChannel, EducationReminderNotificationTargetRecord, EducationReminderTemplateRecord } from "../types";

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
  "department" | "engineerId" | "grade" | "highlightTone" | "name" | "phoneNo" | "rowKey" | "targetEducationNames"
> & {
  scheduledEducation1: string;
  scheduledEducation2: string;
};

export type EducationReminderSendHistoryRetryTarget = Pick<
  EducationReminderSendHistoryRecord,
  "actualPhoneNo" | "batchId" | "channel" | "departmentName" | "engineerName" | "failureReason" | "logId" | "messageContent" | "requestedAt" | "requestedBy" | "sentAt" | "status" | "targetPhoneNo" | "templateName" | "testSend"
>;

export type EducationReminderSendTemplate = EducationReminderTemplateRecord;
