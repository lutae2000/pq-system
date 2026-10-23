"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { useMemo } from "react";

import { useCommonCodeLevel2Options, useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import { BidNoticeDetailDialog } from "@/modules/pq/bid-notice/BidNoticeDetailDialog";
import type { BidNoticeDetailOptions } from "@/modules/pq/bid-notice/bidNoticeApi";
import { useBidNoticeDetail } from "@/modules/pq/bid-notice/application/useBidNoticeQueries";

type BidNoticeDetailPopupProps = {
  bidSeq: number | null;
  onClose: () => void;
  open: boolean;
  readOnly?: boolean;
};

export function BidNoticeDetailPopup({ bidSeq, onClose, open, readOnly = true }: BidNoticeDetailPopupProps) {
  const detailQuery = useBidNoticeDetail(bidSeq, open);

  const bidMethodOptions = useCommonCodeLevel2Options("ZA", undefined, { enabled: open });
  const businessFieldOptions = useCommonCodeLevel2Options("DA", undefined, { enabled: open });
  const orderMethodOptions = useCommonCodeLevel2Options("FA", { useYn: "Y" }, { enabled: open }, "level2Code");
  const bidTypeOptions = useCommonCodeLevel2Options("MB", undefined, { enabled: open });
  const businessTypeOptions = useCommonCodeLevel2Options("CA", undefined, { enabled: open });
  const businessScopeOptions = useCommonCodeLevel2Options("T2", undefined, { enabled: open });
  const finalParticipationOptions = useCommonCodeLevel2Options("YA", undefined, { enabled: open });
  const reasonOfAbsenceOptions = useCommonCodeLevel2Options("T3", undefined, { enabled: open });
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
      reasonsOfAbsence: reasonOfAbsenceOptions.options,
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
      reasonOfAbsenceOptions.options,
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
        record={detailQuery.data}
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
