"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import { AuditFields } from "@/components/common/AuditFields";
import { FileActionCard } from "@/components/common/FileActionCard";
import { standardFieldSx } from "@/components/common/FormControls";
import { ClientSelect } from "@/components/common/reference-selects";
import {
  SERVICE_PERFORMANCE_ATTACHMENT_OWNER_TYPE,
  SERVICE_PERFORMANCE_ATTACHMENT_TYPE,
  type ServicePerformanceRecord,
} from "@/modules/pq/service-performance-management/api";

type ServicePerformanceDetailDialogProps = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  amountReflectedEvaluationScore: number | null;
  clientSelectParams: { size: number };
  deleting?: boolean;
  draft: ServicePerformanceRecord;
  onClose: () => void;
  onDelete: () => void;
  onDraftChange: <K extends keyof ServicePerformanceRecord>(
    field: K,
    value: ServicePerformanceRecord[K],
  ) => void;
  onSave: () => void;
  open: boolean;
  saving?: boolean;
};

const text = (value: string | null | undefined) => value || "";
const numberValue = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);
const compactDate = (value: string | null | undefined) =>
  text(value).replace(/\D/g, "").slice(0, 8);
const dashedDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8
    ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`
    : "";
};

export function ServicePerformanceDetailDialog({
  canCreate,
  canDelete,
  canUpdate,
  amountReflectedEvaluationScore,
  clientSelectParams,
  deleting = false,
  draft,
  onClose,
  onDelete,
  onDraftChange,
  onSave,
  open,
  saving = false,
}: ServicePerformanceDetailDialogProps) {
  const canSave = draft.id > 0 ? canUpdate : canCreate;
  const isEditable = draft.id > 0 ? canUpdate : canCreate;
  const fileOwnerId = draft.id > 0 ? draft.id : "";

  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            용역 수행성과 상세
          </Typography>
          <Typography color="text.secondary" variant="body2">
            선택한 수행성과를 확인하고 수정합니다.
          </Typography>
        </Box>
        <Button
          color="inherit"
          onClick={onClose}
          startIcon={<CloseOutlinedIcon />}
          variant="outlined"
        >
          닫기
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <Box
          sx={{
            alignItems: "start",
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.05fr) minmax(360px, 0.95fr)",
            },
          }}
        >
          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    기본 정보
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                  <Button
                    disabled={!canSave || saving}
                    onClick={onSave}
                    startIcon={<SaveOutlinedIcon />}
                    variant="contained"
                  >
                    저장
                  </Button>
                  <Button
                    color="error"
                    disabled={!canDelete || draft.id === 0 || deleting}
                    onClick={onDelete}
                    startIcon={<DeleteOutlineOutlinedIcon />}
                    variant="outlined"
                  >
                    삭제
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                <ClientSelect
                  disabled={!isEditable}
                  label="발주처"
                  onChange={(value) => onDraftChange("clientCode", value)}
                  params={clientSelectParams}
                  required
                  sx={standardFieldSx}
                  value={text(draft.clientCode)}
                />
                <TextField
                  disabled={!isEditable}
                  label="분야"
                  onChange={(event) =>
                    onDraftChange("fieldName", event.target.value)
                  }
                  required
                  size="small"
                  sx={standardFieldSx}
                  value={text(draft.fieldName)}
                />
                <TextField
                  disabled={!isEditable}
                  label="현장명"
                  onChange={(event) =>
                    onDraftChange("siteName", event.target.value)
                  }
                  required
                  size="small"
                  sx={standardFieldSx}
                  value={text(draft.siteName)}
                />
                <TextField
                  disabled={!isEditable}
                  label="평가일"
                  onChange={(event) =>
                    onDraftChange("evaluationDate", event.target.value)
                  }
                  required
                  size="small"
                  sx={standardFieldSx}
                  type="date"
                  value={dashedDate(draft.evaluationDate)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  disabled={!isEditable}
                  label="용역금액(백만원)"
                  onChange={(event) =>
                    onDraftChange(
                      "serviceAmount",
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                    )
                  }
                  size="small"
                  sx={standardFieldSx}
                  type="number"
                  value={numberValue(draft.serviceAmount)}
                />
                <TextField
                  disabled={!isEditable}
                  label="평가점수(점)"
                  onChange={(event) =>
                    onDraftChange(
                      "evaluationScore",
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                    )
                  }
                  size="small"
                  sx={standardFieldSx}
                  type="number"
                  value={numberValue(draft.evaluationScore)}
                />
                <TextField
                  label="금액반영 평가점수(점)"
                  size="small"
                  sx={standardFieldSx}
                  type="number"
                  slotProps={{ input: { readOnly: true } }}
                  value={numberValue(amountReflectedEvaluationScore)}
                />
                <TextField
                  disabled={!isEditable}
                  label="비고"
                  minRows={4}
                  multiline
                  onChange={(event) =>
                    onDraftChange("remark", event.target.value)
                  }
                  sx={{ gridColumn: "1 / -1" }}
                  value={text(draft.remark)}
                />
              </Box>

              <AuditFields
                createdAt={draft.createdAt}
                createdBy={draft.createdId}
                updatedAt={draft.lastChangedAt}
                updatedBy={draft.lastChangedId}
              />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}
            >
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                첨부파일
              </Typography>
              <FileActionCard
                attachmentTarget={
                  fileOwnerId
                    ? {
                        attachmentType: SERVICE_PERFORMANCE_ATTACHMENT_TYPE,
                        ownerId: fileOwnerId,
                        ownerType: SERVICE_PERFORMANCE_ATTACHMENT_OWNER_TYPE,
                      }
                    : undefined
                }
                deleteDisabled={!canDelete}
                description={
                  fileOwnerId
                    ? "선택한 실적의 첨부파일을 관리합니다."
                    : "실적을 저장한 뒤에만 파일을 업로드할 수 있습니다."
                }
                multiple
                title="파일"
                uploadDisabled={!fileOwnerId || (!canCreate && !canUpdate)}
                uploadLabel="파일 업로드"
              />
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button
          onClick={onClose}
          startIcon={<CloseOutlinedIcon />}
          variant="outlined"
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
