import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

import type { CompanyAttachment } from "./companyProfile.types";

type CompanyAttachmentDeleteDialogProps = {
  canDelete: boolean;
  isPending: boolean;
  target: CompanyAttachment | null;
  onClose: () => void;
  onConfirm: (attachmentId: number) => void;
};

export function CompanyAttachmentDeleteDialog({
  canDelete,
  isPending,
  target,
  onClose,
  onConfirm,
}: CompanyAttachmentDeleteDialogProps) {
  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={Boolean(target)}
      onClose={() => {
        if (!isPending) {
          onClose();
        }
      }}
    >
      <DialogTitle>첨부파일을 삭제하시겠습니까?</DialogTitle>
      <DialogContent>
        <Typography sx={{ overflowWrap: "anywhere" }} variant="body2">
          {target?.originalFilename ?? "선택한 파일"}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={isPending} onClick={onClose} variant="outlined">
          취소
        </Button>
        <Button
          color="error"
          disabled={!canDelete || isPending || !target}
          onClick={() => {
            if (target) {
              onConfirm(target.attachmentId);
            }
          }}
          variant="contained"
        >
          삭제
        </Button>
      </DialogActions>
    </Dialog>
  );
}
