import { dateTimeText, toDateInputValue } from "@/modules/common/formatters";
import type { SubmissionDetailResponse } from "../api";

function noticeDateTime(value: string | null) {
  const compact = /^(\d{8})(?:(\d{2})(\d{2}))?$/.exec(value?.trim() ?? "");
  if (!compact) return dateTimeText(value);
  const date = toDateInputValue(compact[1]);
  return compact[2] ? `${date} ${compact[2]}:${compact[3]}` : date;
}

export function toSubmissionDetailRow(
  notice: SubmissionDetailResponse,
  departmentLabels: Record<string, string>,
  businessTypeLabels: Record<string, string>,
  participationLabels: Record<string, string>,
) {
  const department = notice.departmentCode ?? "";
  const businessType = notice.businessType?.trim() ?? "";
  const finalParticipationStatus = notice.participateYn?.trim() ?? "";
  const bidSuccessYn = notice.bidSuccessYn ?? "";
  const designAmt = Number(notice.designAmt ?? 0);

  return {
    id: notice.bidSeq,
    bidNo: String(notice.bidSeq),
    participationStatus: participationLabels[finalParticipationStatus] || finalParticipationStatus || "참여",
    finalParticipationStatus,
    bidSuccessYn,
    bidSuccessYnLabel: bidSuccessYn === "Y" ? "낙찰" : "미낙찰",
    department,
    departmentName: department ? departmentLabels[department] || department : "미지정",
    businessTypeLabel: businessTypeLabels[businessType] || businessType,
    client: notice.orderClient ?? "",
    orderClientName: notice.orderClientName ?? "",
    projectName: notice.projectName,
    noticeDate: toDateInputValue(notice.announceDate),
    pqSubmissionDate: toDateInputValue(notice.pqSubmitDate),
    bidClosingDate: noticeDateTime(notice.bidClosingDate),
    bidSubmissionDate: noticeDateTime(notice.bidSubmissionDate),
    bidDate: noticeDateTime(notice.bidDate),
    designAmt,
    estimateAmount: designAmt,
    writerName: notice.superDecideEmpno ?? "",
    noticeNumber: notice.g2bBidNtceNo ?? "",
  };
}
