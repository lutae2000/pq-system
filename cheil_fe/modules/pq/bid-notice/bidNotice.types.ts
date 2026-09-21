import type { FileActionCardFileItem } from "@/components/common/FileActionCard";

export type ParticipationStatus = string;
export type BidNoticeCategory = "공고" | "안내" | "공시";
export type Department = string;
export type BusinessField = string;
export type BusinessScope = string;
export type BidMethod = string;
export type BidNoticePeriodType = "NOTICE" | "BID" | "PQ";

export type AttachmentKey = "announcement" | "evaluation" | "guide" | "specification" | "submission";

export type BidNoticeAttachmentState = Record<AttachmentKey, FileActionCardFileItem[]>;

export type BidNoticeRecord = {
  active: boolean;
  baseAmount: number;
  bidDate: string;
  interviewDate: string;
  bidStyle: string;
  bidMethod: BidMethod;
  bidNo: string;
  bidClosingDate: string;
  bidType: string;
  bidTypeLabel: string;
  bidMethodLabel: string;
  businessField: BusinessField;
  fieldOfWorkLabel: string;
  businessScope: BusinessScope;
  scopeOfWorkLabel: string;
  businessType: string;
  businessTypeLabel: string;
  category: BidNoticeCategory;
  client: string;
  orderClientName: string;
  content: string;
  department: Department;
  departmentName: string;
  draftNote: string;
  electronicVendor: string;
  endDate: string;
  estimateAmount: number;
  designAmt: number;
  id: string;
  managerConfirmed: boolean;
  noticeDate: string;
  onSiteMeetingDate: string;
  participationStatus: ParticipationStatus;
  finalParticipationStatus: string;
  pqRegistrationDate: string;
  pqSubmissionDate: string;
  pqDecideEmpno: string;
  projectName: string;
  procurementMethod: string;
  orderMethodLabel: string;
  representativeVendor: string;
  bidSubmissionDate: string;
  writerName: string;
  seqNo: number;
  sortOrder: number;
  startDate: string;
  tpSubmissionDate: string;
  bidSuccessYn: string;
  bidSuccessYnLabel: string;
  visible: boolean;
};

export type BidNoticeFilters = {
  department: Department | "";
  superDecideEmpno: string;
  keyword: string;
  bidMethod: BidMethod | "";
  businessType: string;
  periodType: BidNoticePeriodType;
  periodStartDate: string;
  periodEndDate: string;
  bidSuccessYn: "" | "Y" | "N";
  participationStatuses: ParticipationStatus[];
};
