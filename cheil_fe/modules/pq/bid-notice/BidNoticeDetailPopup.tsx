"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { BidNoticeDetailDialog } from "@/modules/pq/bid-notice/BidNoticeDetailDialog";
import { useBidNoticeDetail } from "@/modules/pq/bid-notice/application/useBidNoticeQueries";

type BidNoticeDetailPopupProps = {
  bidSeq: number | null;
  onClose: () => void;
  open: boolean;
  readOnly?: boolean;
};

export function BidNoticeDetailPopup({ bidSeq, onClose, open, readOnly = true }: BidNoticeDetailPopupProps) {
  const detailQuery = useBidNoticeDetail(bidSeq, open);

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
