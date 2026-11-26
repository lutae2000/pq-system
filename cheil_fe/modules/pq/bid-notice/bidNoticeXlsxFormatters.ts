import type { BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";

const textOrEmpty = (value: unknown) => (value === null || value === undefined ? "" : String(value));

const preferLabel = (label: unknown, value: unknown) => textOrEmpty(label) || textOrEmpty(value);

export const formatLabelFieldForXlsx =
  <Field extends keyof BidNoticeRecord>(labelField: Field) =>
  (value: unknown, row?: Pick<BidNoticeRecord, Field>) =>
    preferLabel(row?.[labelField], value);

export const formatBidSuccessForXlsx = (value: unknown, row?: Pick<BidNoticeRecord, "bidSuccessYn" | "bidSuccessYnLabel">) => {
  const bidSuccessYn = textOrEmpty(row?.bidSuccessYn ?? value);
  const bidSuccessYnLabel = textOrEmpty(row?.bidSuccessYnLabel);

  if (bidSuccessYnLabel) {
    return bidSuccessYnLabel;
  }

  if (bidSuccessYn === "Y") {
    return "낙찰";
  }

  return bidSuccessYn === "N" ? "" : bidSuccessYn;
};

export const formatDepartmentForXlsx = formatLabelFieldForXlsx("departmentName");

export const formatOrderClientForXlsx = formatLabelFieldForXlsx("orderClientName");

export const formatRegistrantForXlsx = (userNameByEmployeeNo: Record<string, string>) => (value: unknown, row?: Pick<BidNoticeRecord, "writerName">) => {
  const employeeNo = textOrEmpty(row?.writerName ?? value);
  return userNameByEmployeeNo[employeeNo] ?? employeeNo;
};
