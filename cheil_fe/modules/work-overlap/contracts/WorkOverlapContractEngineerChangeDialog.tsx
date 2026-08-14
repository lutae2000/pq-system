"use client";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Dispatch, SetStateAction } from "react";

import { standardFieldSx } from "@/components/common/FormControls";
import type { WorkOverlapContractEngineerCandidate } from "@/modules/pq/work-overlap-contracts/api";

export type EngineerChangeDraft = {
  beforeEngineer: WorkOverlapContractEngineerCandidate | null;
  afterEngineer: WorkOverlapContractEngineerCandidate | null;
  changeContent: string;
  participationDate: string;
  participationType: string;
  pqTargetYn: boolean;
  remark: string;
};

type WorkOverlapContractEngineerChangeDialogProps = {
  draft: EngineerChangeDraft | null;
  loading?: boolean;
  onClose: () => void;
  onDraftChange: Dispatch<SetStateAction<EngineerChangeDraft | null>>;
  onSearch: (keyword: string) => void;
  onSubmit: () => void;
  options: WorkOverlapContractEngineerCandidate[];
  submitDisabled?: boolean;
};

const engineerLabel = (engineer: Pick<WorkOverlapContractEngineerCandidate, "engineerId" | "name">) =>
  engineer.name ? `${engineer.name} (${engineer.engineerId})` : engineer.engineerId;

const formatBirthDate = (value: string | null | undefined) => {
  const normalized = (value ?? "").replace(/\D/g, "").slice(0, 8);
  if (normalized.length === 8) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  return value ?? "";
};

export function WorkOverlapContractEngineerChangeDialog({
  draft,
  loading = false,
  onClose,
  onDraftChange,
  onSearch,
  onSubmit,
  options,
  submitDisabled = false,
}: WorkOverlapContractEngineerChangeDialogProps) {
  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={Boolean(draft)}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: "min(760px, calc(100vw - 24px))" },
            maxWidth: "none",
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
        <Typography component="div" sx={{ fontWeight: 800 }} variant="h6">
          참여 기술인 수정
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, display: "grid", gap: 1, p: 1.25 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }} variant="subtitle2">
                변경전 기술인
              </Typography>
              <TextField
                disabled
                label="기술인"
                size="small"
                sx={standardFieldSx}
                value={draft?.beforeEngineer ? engineerLabel(draft.beforeEngineer) : ""}
              />
              <TextField disabled label="생년월일" size="small" sx={standardFieldSx} value={formatBirthDate(draft?.beforeEngineer?.birthDate)} />
            </Box>
            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, display: "grid", gap: 1, p: 1.25 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }} variant="subtitle2">
                변경후 기술인
              </Typography>
              <Autocomplete
                autoHighlight
                disablePortal
                getOptionLabel={engineerLabel}
                isOptionEqualToValue={(option, value) => option.engineerId === value.engineerId}
                loading={loading}
                onChange={(_event, nextValue) =>
                  onDraftChange((current) =>
                    current
                      ? {
                          ...current,
                          afterEngineer: nextValue
                            ? {
                                ...nextValue,
                                field: current.afterEngineer?.field ?? "",
                              }
                            : nextValue,
                        }
                      : current,
                  )
                }
                onInputChange={(_event, nextInputValue, reason) => {
                  if (reason === "input") {
                    onSearch(nextInputValue);
                  }
                }}
                options={options}
                renderInput={(params) => <TextField {...params} label="기술인" required size="small" sx={standardFieldSx} />}
                value={draft?.afterEngineer ?? null}
              />
              <TextField disabled label="생년월일" size="small" sx={standardFieldSx} value={formatBirthDate(draft?.afterEngineer?.birthDate)} />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
            <TextField
              label="분야"
              onChange={(event) =>
                onDraftChange((current) =>
                  current
                    ? {
                        ...current,
                        afterEngineer: current.afterEngineer
                          ? {
                              ...current.afterEngineer,
                              field: event.target.value,
                            }
                          : current.afterEngineer,
                      }
                    : current,
                )
              }
              size="small"
              sx={standardFieldSx}
              value={draft?.afterEngineer?.field ?? ""}
            />

            <TextField
              label="참여구분"
              onChange={(event) => onDraftChange((current) => (current ? { ...current, participationType: event.target.value } : current))}
              size="small"
              sx={standardFieldSx}
              value={draft?.participationType ?? ""}
            />

            <TextField
              label="참여날짜"
              onChange={(event) => onDraftChange((current) => (current ? { ...current, participationDate: event.target.value } : current))}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={standardFieldSx}
                type="date"
                value={draft?.participationDate ?? ""}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(draft?.pqTargetYn)}
                  onChange={(_event, checked) => onDraftChange((current) => (current ? { ...current, pqTargetYn: checked } : current))}
                  size="small"
                />
              }
              label="PQ대상자"
              sx={{ alignItems: "center", minHeight: 40, m: 0 }}
            />
          </Box>
          <TextField
            label="비고"
            multiline
            minRows={2}
            onChange={(event) => onDraftChange((current) => (current ? { ...current, remark: event.target.value } : current))}
            size="small"
            sx={standardFieldSx}
            value={draft?.remark ?? ""}
          />
          <TextField
            label="변경내용"
            multiline
            minRows={3}
            onChange={(event) => onDraftChange((current) => (current ? { ...current, changeContent: event.target.value } : current))}
            required
            size="small"
            sx={standardFieldSx}
            value={draft?.changeContent ?? ""}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined">
          취소
        </Button>
        <Button disabled={submitDisabled} onClick={onSubmit} startIcon={<SaveOutlinedIcon />} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
