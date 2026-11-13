import { ConfirmDeleteDialog } from "@/components/common/ConfirmActionDialog";

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
    <ConfirmDeleteDialog
      open={Boolean(target)}
      loading={isPending}
      confirmDisabled={!canDelete || !target}
      message="첨부파일을 삭제하시겠습니까?"
      targetLabel={target?.originalFilename ?? "선택한 파일"}
      onClose={onClose}
      onConfirm={() => {
        if (target) onConfirm(target.attachmentId);
      }}
    />
  );
}
