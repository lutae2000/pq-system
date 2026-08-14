import type { BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";

const textOrEmpty = (value: unknown) => (value === null || value === undefined ? "" : String(value));

const preferLabel = (label: unknown, value: unknown) => textOrEmpty(label) || textOrEmpty(value);

export const formatLabelFieldForXlsx =
  (labelField: keyof BidNoticeRecord) =>
  (value: unknown, row?: BidNoticeRecord) =>
    preferLabel(row?.[labelField], value);

export const formatBidSuccessForXlsx = (value: unknown, row?: BidNoticeRecord) => {
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
