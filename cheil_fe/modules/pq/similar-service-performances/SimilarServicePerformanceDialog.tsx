"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { AuditFields } from "@/components/common/AuditFields";
import { FileActionCard } from "@/components/common/FileActionCard";
import { standardFieldSx } from "@/components/common/FormControls";
import {
  calculateAppliedAmount,
  calculateRecentThreeYearPeriodRange,
  defaultSimilarServicePerformanceRecord,
  formatDateInputValue,
  formatNumberInputValue,
  formatNumberText,
  formatText,
  normalizeNumberInputValue,
  type SimilarServicePerformanceRecord,
} from "@/modules/pq/similar-service-performances/similarServicePerformanceForm";

type SimilarServicePerformanceDialogProps = {
  deleting?: boolean;
  deleteDisabled?: boolean;
  onClose: () => void;
  onDelete?: (record: SimilarServicePerformanceRecord) => void;
  onFieldChange: <K extends keyof SimilarServicePerformanceRecord>(field: K, value: SimilarServicePerformanceRecord[K]) => void;
  onSave: (record: SimilarServicePerformanceRecord) => void;
  open: boolean;
  permissions: {
    canCreate: boolean;
    canDelete: boolean;
    canUpdate: boolean;
  };
  referenceDate: string;
  record: SimilarServicePerformanceRecord | null;
  saveDisabled?: boolean;
  saving?: boolean;
};

const SIMILAR_SERVICE_PERFORMANCE_ATTACHMENT_OWNER_TYPE = "SIMILAR_SERVICE_PERFORMANCE";
const SIMILAR_SERVICE_PERFORMANCE_ATTACHMENT_TYPE = "PERFORMANCE";

const toText = (value: string | null | undefined) => value ?? "";

const Section = ({ children, fullWidth = false, icon, order, rightColumn = false, title }: { children: ReactNode; fullWidth?: boolean; icon?: ReactNode; order?: number; rightColumn?: boolean; title: string }) => (
  <Box
    sx={{
      backgroundColor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1.5,
      display: "grid",
      gap: 1.25,
      ...(fullWidth ? { gridColumn: { xs: "1", sm: "1 / -1" } } : {}),
      ...(rightColumn ? { gridColumn: { xs: "1", sm: "2" } } : {}),
      ...(order ? { order } : {}),
      p: 1.5,
    }}
  >
    <Box
      sx={{
        alignItems: "center",
        backgroundColor: "action.hover",
        borderRadius: 1,
        display: "flex",
        gap: 0.75,
        minHeight: 36,
        px: 1,
      }}
    >
      {icon ? <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box> : null}
      <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 800 }} variant="subtitle2">
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

export function SimilarServicePerformanceDialog({
  deleting = false,
  deleteDisabled = false,
  onClose,
  onDelete,
  onFieldChange,
  onSave,
  open,
  permissions,
  referenceDate,
  record,
  saveDisabled = false,
  saving = false,
}: SimilarServicePerformanceDialogProps) {
  const draft = record ?? defaultSimilarServicePerformanceRecord();
  const fileOwnerId = draft.id ?? "";
  const isNew = draft.id === null;
  const canSave = isNew ? permissions.canCreate : permissions.canUpdate;
  const canDelete = draft.id !== null && permissions.canDelete;
  const formDisabled = !canSave || saving || deleting;
  const recentThreeYearPeriod = calculateRecentThreeYearPeriodRange(referenceDate, draft.contractFromDate, draft.contractToDate);

  return (
    <Dialog fullWidth maxWidth="xl" onClose={saving || deleting ? undefined : onClose} open={open}>
      <DialogTitle sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
        <Typography component="span" sx={{ fontWeight: 800 }} variant="h6">
          유사용역 수행실적 상세
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 520px" } }}>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, minWidth: 0 }}>
            <Section fullWidth icon={<InfoOutlinedIcon fontSize="small" />} order={1} title="기본 정보">
              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: { xs: "1fr", sm: "96px minmax(0, 1fr)" },
                }}
              >
                <TextField disabled label="ID" size="small" sx={standardFieldSx} value={draft.id ?? ""} />
                <TextField
                  disabled={formDisabled}
                  label="용역명"
                  onChange={(event) => onFieldChange("serviceName", event.target.value)}
                  required
                  size="small"
                  sx={standardFieldSx}
                  value={toText(draft.serviceName)}
                />
                <TextField
                  disabled={formDisabled}
                  label="공종"
                  onChange={(event) => onFieldChange("constructionType", event.target.value || null)}
                  size="small"
                  sx={standardFieldSx}
                  value={toText(draft.constructionType)}
                />
                <TextField
                  disabled={formDisabled}
                  label="발주처"
                  onChange={(event) => onFieldChange("client", event.target.value || null)}
                  size="small"
                  sx={standardFieldSx}
                  value={toText(draft.client)}
                />
                <Box sx={{ display: "grid", gap: 1.25, gridColumn: { xs: "1", sm: "1 / -1" }, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                  <TextField
                    disabled={formDisabled}
                    inputMode="numeric"
                    label="계약금액"
                    onChange={(event) => onFieldChange("contractPrice", normalizeNumberInputValue(event.target.value))}
                    size="small"
                    sx={standardFieldSx}
                    type="text"
                    value={formatNumberInputValue(draft.contractPrice)}
                  />
                  <TextField
                    disabled={formDisabled}
                    inputMode="numeric"
                    label="지분율"
                    onChange={(event) => onFieldChange("shareRatio", normalizeNumberInputValue(event.target.value))}
                    size="small"
                    sx={standardFieldSx}
                    type="text"
                    value={formatNumberInputValue(draft.shareRatio)}
                  />
                </Box>
              </Box>
            </Section>

            <Stack spacing={0} sx={{ display: "contents" }}>
              <Section icon={<CalendarMonthOutlinedIcon fontSize="small" />} order={2} title="계약기간">
                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                  <TextField
                    disabled={formDisabled}
                    label="계약 시작일"
                    onChange={(event) => onFieldChange("contractFromDate", event.target.value || null)}
                    size="small"
                    sx={standardFieldSx}
                    type="date"
                    value={formatDateInputValue(draft.contractFromDate)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    disabled={formDisabled}
                    label="계약 종료일"
                    onChange={(event) => onFieldChange("contractToDate", event.target.value || null)}
                    size="small"
                    sx={standardFieldSx}
                    type="date"
                    value={formatDateInputValue(draft.contractToDate)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </Section>

              <Section icon={<CalendarMonthOutlinedIcon fontSize="small" />} order={3} rightColumn title="최근 3년간 수행기간">
                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                  <TextField
                    disabled
                    label="수행 시작일"
                    size="small"
                    sx={standardFieldSx}
                    type="date"
                    value={formatDateInputValue(recentThreeYearPeriod.fromDate)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    disabled
                    label="수행 종료일"
                    size="small"
                    sx={standardFieldSx}
                    type="date"
                    value={formatDateInputValue(recentThreeYearPeriod.toDate)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </Section>

              <Section icon={<CalendarMonthOutlinedIcon fontSize="small" />} order={4} title="공사기간">
                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                  <TextField
                    disabled={formDisabled}
                    label="공사 시작일"
                    onChange={(event) => onFieldChange("constructionFromDate", event.target.value || null)}
                    size="small"
                    sx={standardFieldSx}
                    type="date"
                    value={formatDateInputValue(draft.constructionFromDate)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    disabled={formDisabled}
                    label="공사 종료일"
                    onChange={(event) => onFieldChange("constructionToDate", event.target.value || null)}
                    size="small"
                    sx={standardFieldSx}
                    type="date"
                    value={formatDateInputValue(draft.constructionToDate)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </Section>
            </Stack>

            <Section icon={<PaymentsOutlinedIcon fontSize="small" />} order={5} rightColumn title="수치 정보">
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                <TextField
                  disabled={formDisabled}
                  inputMode="numeric"
                  label="가중치"
                  onChange={(event) => onFieldChange("weight", normalizeNumberInputValue(event.target.value))}
                  size="small"
                  sx={standardFieldSx}
                  type="text"
                  value={formatNumberInputValue(draft.weight)}
                />
                <TextField
                  disabled
                  label="가중치 적용금액"
                  size="small"
                  sx={standardFieldSx}
                  value={formatNumberText(calculateAppliedAmount(draft.contractPrice, draft.weight))}
                />
              </Box>
            </Section>

            <Section fullWidth icon={<NotesOutlinedIcon fontSize="small" />} order={6} title="기타">
              <TextField
                disabled={formDisabled}
                label="개요"
                multiline
                minRows={4}
                onChange={(event) => onFieldChange("summary", event.target.value || null)}
                size="small"
                sx={standardFieldSx}
                value={formatText(draft.summary)}
              />
            </Section>

          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Section icon={<AttachFileOutlinedIcon fontSize="small" />} title="첨부파일">
              <FileActionCard
                attachmentTarget={
                  fileOwnerId
                    ? {
                        attachmentType: SIMILAR_SERVICE_PERFORMANCE_ATTACHMENT_TYPE,
                        ownerId: fileOwnerId,
                        ownerType: SIMILAR_SERVICE_PERFORMANCE_ATTACHMENT_OWNER_TYPE,
                      }
                    : undefined
                }
                deleteDisabled={!permissions.canDelete || deleting}
                description={fileOwnerId ? "선택한 유사용역 수행실적의 첨부파일을 관리합니다." : "저장 후 첨부파일을 등록할 수 있습니다."}
                multiple
                title="첨부파일"
                uploadDisabled={!fileOwnerId || !canSave || saving || deleting}
                uploadLabel="파일 업로드"
              />
            </Section>
            <Section icon={<NotesOutlinedIcon fontSize="small" />} title="비고">
              <TextField
                disabled={formDisabled}
                fullWidth
                label="비고"
                multiline
                minRows={3}
                onChange={(event) => onFieldChange("remark", event.target.value || null)}
                size="small"
                sx={standardFieldSx}
                value={formatText(draft.remark)}
              />
            </Section>
            <AuditFields
              createdAt={draft.createdAt}
              createdBy={draft.createdId}
              updatedAt={draft.lastChangedAt}
              updatedBy={draft.lastChangedId}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {isNew || !onDelete ? null : (
            <Button
              color="error"
              disabled={deleting || deleteDisabled || !canDelete}
              onClick={() => onDelete(draft)}
              startIcon={<DeleteOutlineOutlinedIcon />}
              variant="outlined"
            >
              삭제
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button disabled={saving || deleting} onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
            취소
          </Button>
          <Button disabled={saving || saveDisabled || !canSave} onClick={() => onSave(draft)} startIcon={<SaveOutlinedIcon />} variant="contained">
            저장
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
