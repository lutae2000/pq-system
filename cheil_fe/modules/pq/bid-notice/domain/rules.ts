import { apiDate, toCompactDate } from "@/modules/common/formatters";
import type { BidNoticeFilters, BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";

export const emptyDraft = (): BidNoticeRecord => ({
  active: true,
  baseAmount: 0,
  bidDate: "",
  interviewDate: "",
  bidStyle: "",
  bidMethod: "",
  bidNo: "",
  bidClosingDate: "",
  bidType: "",
  bidTypeLabel: "",
  bidMethodLabel: "",
  businessField: "",
  fieldOfWorkLabel: "",
  businessScope: "",
  scopeOfWorkLabel: "",
  businessType: "",
  businessTypeLabel: "",
  category: "공고",
  client: "",
  orderClientName: "",
  content: "",
  department: "",
  departmentName: "",
  draftNote: "",
  electronicVendor: "",
  endDate: "",
  estimateAmount: 0,
  designAmt: 0,
  id: "",
  managerConfirmed: false,
  noticeDate: "",
  onSiteMeetingDate: "",
  participationStatus: "",
  finalParticipationStatus: "",
  g2bBidNtceNo: "",
  g2bBidNtceOrd: "",
  pqRegistrationDate: "",
  pqSubmissionDate: "",
  pqDecideEmpno: "",
  projectName: "",
  procurementMethod: "",
  reasonOfAbsenceCode: "",
  orderMethodLabel: "",
  representativeVendor: "",
  bidSubmissionDate: "",
  writerName: "",
  seqNo: 0,
  sortOrder: 1,
  startDate: "",
  tpSubmissionDate: "",
  bidSuccessYn: "",
  bidSuccessYnLabel: "",
  visible: true,
});


export const validateBidNoticeDraft = (
  draft: BidNoticeRecord,
  participationOptions: ReadonlyArray<{ label: string; value: string }>,
): string | null => {
  if (!draft.projectName.trim()) return "사업명을 입력하세요.";
  const selectedStatus = participationOptions.find((option) => option.value === draft.finalParticipationStatus);
  const isAbsent = draft.finalParticipationStatus === "N" || selectedStatus?.label.includes("불참") === true;
  if (isAbsent && !draft.reasonOfAbsenceCode.trim()) return "불참 사유를 선택하세요.";
  return null;
};

export const filterBidNoticeRecords = (records: BidNoticeRecord[], filters: BidNoticeFilters) => {
    return records.filter((record) => {
      const keyword = filters.keyword.trim();
      const matchesKeyword =
        !keyword ||
        [
          record.projectName,
          record.client,
          record.orderClientName,
          record.bidNo,
          record.representativeVendor,
          record.departmentName,
          record.businessTypeLabel,
          record.orderMethodLabel,
          record.participationStatus,
          record.finalParticipationStatus,
          record.bidSuccessYnLabel,
          record.pqDecideEmpno,
          record.writerName,
        ].some((value) => value.includes(keyword));
      const matchesBidMethod = !filters.bidMethod || record.bidMethod === filters.bidMethod;
      const matchesBusinessType = !filters.businessType || record.businessTypeLabel.includes(filters.businessType);
      const matchesDepartment = !filters.department || record.department === filters.department;
      const matchesRegistrant = !filters.superDecideEmpno || record.writerName === filters.superDecideEmpno;
      const matchesStatus = filters.participationStatuses.length === 0 || filters.participationStatuses.includes(record.finalParticipationStatus);
      const periodDate =
        filters.periodType === "NOTICE" ? apiDate(record.noticeDate) : filters.periodType === "BID" ? apiDate(record.bidDate) : apiDate(record.pqSubmissionDate);
      const periodDateKey = toCompactDate(periodDate);
      const matchesPeriodStart = !filters.periodStartDate || periodDateKey >= filters.periodStartDate;
      const matchesPeriodEnd = !filters.periodEndDate || periodDateKey <= filters.periodEndDate;
      const matchesBidSuccess = !filters.bidSuccessYn || record.bidSuccessYn === filters.bidSuccessYn;

      return (
        matchesKeyword &&
        matchesBidMethod &&
        matchesBusinessType &&
        matchesDepartment &&
        matchesRegistrant &&
        matchesStatus &&
        matchesPeriodStart &&
        matchesPeriodEnd &&
        matchesBidSuccess
      );
    });
};
