"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCommonCodeLevel2Options, useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import { dateOnly, dateTimeText, text, ynToBool } from "@/modules/common/formatters";
import { BidNoticeDetailDialog } from "@/modules/pq/bid-notice/BidNoticeDetailDialog";
import type { BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";
import { getBidNotice, type BidNoticeDetailOptions, type BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";

type BidNoticeDetailPopupProps = {
  bidSeq: number | null;
  onClose: () => void;
  open: boolean;
  readOnly?: boolean;
};

const emptyBidNoticeRecord = (): BidNoticeRecord => ({
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
  pqRegistrationDate: "",
  pqSubmissionDate: "",
  pqDecideEmpno: "",
  projectName: "",
  procurementMethod: "",
  orderMethodLabel: "",
  representativeVendor: "",
  bidSubmissionDate: "",
  writerName: "",
  seqNo: 0,
  sortOrder: 0,
  startDate: "",
  tpSubmissionDate: "",
  bidSuccessYn: "",
  bidSuccessYnLabel: "",
  visible: true,
});

const toBidNoticeRecord = (item: BidNoticeApiRecord): BidNoticeRecord => ({
  ...emptyBidNoticeRecord(),
  active: true,
  baseAmount: 0,
  bidDate: dateTimeText(item.bidDate),
  interviewDate: dateOnly(item.interviewDate),
  bidStyle: text(item.processTag),
  bidMethod: text(item.bidMethod),
  bidMethodLabel: text(item.bidMethodLabel),
  bidNo: item.bidSeq ? String(item.bidSeq) : "",
  bidClosingDate: dateTimeText(item.bidClosingDate),
  bidType: text(item.bidType),
  bidTypeLabel: text(item.bidTypeLabel),
  businessField: text(item.fieldOfWorkCode) as BidNoticeRecord["businessField"],
  fieldOfWorkLabel: text(item.fieldOfWorkLabel),
  businessScope: text(item.scopeOfWorkCode) as BidNoticeRecord["businessScope"],
  scopeOfWorkLabel: text(item.scopeOfWorkLabel),
  businessType: text(item.businessType),
  businessTypeLabel: text(item.businessTypeLabel),
  category: "공고",
  client: text(item.orderClient),
  orderClientName: text(item.orderClientName),
  content: "",
  department: text(item.departmentCode) as BidNoticeRecord["department"],
  departmentName: text(item.departmentName),
  draftNote: text(item.remark),
  electronicVendor: "",
  endDate: dateOnly(item.bidClosingDate),
  designAmt: Number(item.designAmt ?? 0),
  estimateAmount: Number(item.designAmt ?? 0),
  id: item.bidSeq ? String(item.bidSeq) : "",
  managerConfirmed: ynToBool(item.bidSuccessYn),
  noticeDate: dateOnly(item.announceDate),
  onSiteMeetingDate: dateTimeText(item.siteBriefingDate),
  participationStatus: text(item.participateYnLabel) || text(item.participateYn),
  finalParticipationStatus: text(item.participateYn),
  pqRegistrationDate: dateTimeText(item.pqRegistDate),
  pqSubmissionDate: dateTimeText(item.pqSubmitDate),
  pqDecideEmpno: text(item.pqDecideEmpno),
  projectName: text(item.projectName),
  procurementMethod: text(item.orderMethod),
  orderMethodLabel: text(item.orderMethodLabel),
  representativeVendor: text(item.primeContractor),
  bidSubmissionDate: dateTimeText(item.bidSubmissionDate),
  writerName: text(item.superDecideEmpno),
  seqNo: item.bidSeq ?? 0,
  sortOrder: item.bidSeq ?? 0,
  startDate: dateOnly(item.announceDate),
  tpSubmissionDate: dateTimeText(item.tpSubmitDate),
  bidSuccessYn: text(item.bidSuccessYn),
  bidSuccessYnLabel: item.bidSuccessYnLabel ?? (item.bidSuccessYn === "Y" ? "낙찰" : "미낙찰"),
  visible: true,
});

export function BidNoticeDetailPopup({ bidSeq, onClose, open, readOnly = true }: BidNoticeDetailPopupProps) {
  const detailQuery = useQuery({
    queryKey: ["bid-notice-detail-popup", bidSeq],
    queryFn: () => getBidNotice(bidSeq ?? 0),
    enabled: open && Boolean(bidSeq),
  });

  const bidMethodOptions = useCommonCodeLevel2Options("ZA", undefined, { enabled: open });
  const businessFieldOptions = useCommonCodeLevel2Options("DA", undefined, { enabled: open });
  const orderMethodOptions = useCommonCodeLevel2Options("FA", { useYn: "Y" }, { enabled: open }, "level2Code");
  const bidTypeOptions = useCommonCodeLevel2Options("MB", undefined, { enabled: open });
  const businessTypeOptions = useCommonCodeLevel2Options("CA", undefined, { enabled: open });
  const businessScopeOptions = useCommonCodeLevel2Options("T2", undefined, { enabled: open });
  const finalParticipationOptions = useCommonCodeLevel2Options("YA", undefined, { enabled: open });
  const departmentOptions = useDepartmentOptions({ useYn: true }, { enabled: open });

  const detailOptions = useMemo<BidNoticeDetailOptions>(
    () => ({
      bidMethods: bidMethodOptions.options,
      businessFields: businessFieldOptions.options,
      orderMethods: orderMethodOptions.options,
      bidTypes: bidTypeOptions.options,
      businessTypes: businessTypeOptions.options,
      businessScopes: businessScopeOptions.options,
      finalParticipationStatuses: finalParticipationOptions.options,
      clients: [],
      departments: departmentOptions.options,
    }),
    [
      bidMethodOptions.options,
      businessFieldOptions.options,
      orderMethodOptions.options,
      bidTypeOptions.options,
      businessTypeOptions.options,
      businessScopeOptions.options,
      finalParticipationOptions.options,
      departmentOptions.options,
    ],
  );

  if (!open || !bidSeq) {
    return null;
  }

  if (detailQuery.data) {
    return (
      <BidNoticeDetailDialog
        onClose={onClose}
        onDeleteRequest={() => undefined}
        onFieldChange={() => undefined}
        onSave={() => undefined}
        options={detailOptions}
        open={open}
        readOnly={readOnly}
        record={toBidNoticeRecord(detailQuery.data)}
        saveDisabled
        deleteDisabled
      />
    );
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", gap: 2, justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 800 }}>공고문 상세</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 180 }}>
        {detailQuery.isError ? (
          <Alert severity="error">공고문 상세를 불러오지 못했습니다.</Alert>
        ) : (
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 140 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
