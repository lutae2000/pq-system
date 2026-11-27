"use client";

import { DateInput } from "@/components/common/DateTimeInput";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
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
import { alpha } from "@mui/material/styles";
import { useId, useState, type Dispatch, type SetStateAction } from "react";

import { standardFieldSx } from "@/components/common/FormControls";
import type { WorkOverlapContractEngineerCandidate } from "@/modules/work-overlap/contracts/api";

export type EngineerChangeDraft = {
  beforeEngineer: WorkOverlapContractEngineerCandidate | null;
  beforeField: string;
  beforeParticipationType: string;
  afterEngineer: WorkOverlapContractEngineerCandidate | null;
  field: string;
  historyParticipationStartDate: string;
  historyParticipationEndDate: string;
  participationDate: string;
  participationEndDate: string;
  participationType: string;
  pqTargetYn: boolean;
  initialRemark: string;
};

export type EngineerChangeFormValues = {
  beforeField: string;
  beforeParticipationType: string;
  field: string;
  participationType: string;
  changeContent: string;
  remark: string;
};

type WorkOverlapContractEngineerChangeDialogProps = {
  draft: EngineerChangeDraft | null;
  loading?: boolean;
  onClose: () => void;
  onDraftChange: Dispatch<SetStateAction<EngineerChangeDraft | null>>;
  onSearch: (keyword: string) => void;
  onSubmit: (values: EngineerChangeFormValues) => void;
  options: WorkOverlapContractEngineerCandidate[];
  submitDisabled?: boolean;
};

const engineerLabel = (engineer: Pick<WorkOverlapContractEngineerCandidate, "engineerId" | "name">) =>
  engineer.name ? `${engineer.name} (${engineer.engineerId})` : engineer.engineerId;

const engineerSectionSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  display: "grid",
  gap: 1.25,
  gridTemplateColumns: "minmax(0, 1fr)",
  p: 1.25,
};

const engineerSectionHeadingSx = {
  alignItems: "center",
  borderRadius: 1.25,
  display: "flex",
  fontSize: 15,
  fontWeight: 800,
  gap: 1,
  px: 1.25,
  py: 1,
};

const engineerIdentitySx = {
  display: "grid",
  gap: 1.25,
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, min(42%, 160px))",
};

const participationFieldsSx = {
  display: "grid",
  gap: 1.25,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
};

function EngineerParticipationInputs({
  fieldName,
  initialField,
  initialParticipationType,
  participationTypeName,
}: {
  fieldName: "beforeField" | "field";
  initialField: string;
  initialParticipationType: string;
  participationTypeName: "beforeParticipationType" | "participationType";
}) {
  return (
    <Box sx={participationFieldsSx}>
      <TextField
        defaultValue={initialField}
        label="분야"
        name={fieldName}
        size="small"
        slotProps={{ htmlInput: { maxLength: 100 } }}
        sx={standardFieldSx}
      />
      <TextField
        defaultValue={initialParticipationType}
        label="참여구분"
        name={participationTypeName}
        size="small"
        slotProps={{ htmlInput: { maxLength: 100 } }}
        sx={standardFieldSx}
      />
    </Box>
  );
}

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
  const formId = useId();
  const [hasChangeContent, setHasChangeContent] = useState(false);
  const engineerChanged = Boolean(
    draft?.beforeEngineer && draft.afterEngineer &&
      draft.beforeEngineer.engineerId !== draft.afterEngineer.engineerId,
  );
  const saveDisabled = submitDisabled || (engineerChanged && !hasChangeContent);

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
        <Stack
          component="form"
          id={formId}
          spacing={1.5}
          onSubmit={(event) => {
            event.preventDefault();
            if (saveDisabled) return;
            const formValues = new FormData(event.currentTarget);
            const read = (name: keyof EngineerChangeFormValues) => String(formValues.get(name) ?? "");
            onSubmit({
              beforeField: read("beforeField"),
              beforeParticipationType: read("beforeParticipationType"),
              field: read("field"),
              participationType: read("participationType"),
              changeContent: read("changeContent"),
              remark: read("remark"),
            });
          }}
        >
          <Box
            sx={{
              alignItems: "start",
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <Box sx={engineerSectionSx}>
              <Typography
                component="h3"
                sx={{ ...engineerSectionHeadingSx, bgcolor: "action.hover", color: "text.primary" }}
              >
                <HistoryOutlinedIcon fontSize="small" />
                변경 전 기술인
              </Typography>
              <Box sx={engineerIdentitySx}>
                <TextField
                  disabled
                  fullWidth
                  label="기술인"
                  size="small"
                  sx={standardFieldSx}
                  value={draft?.beforeEngineer ? engineerLabel(draft.beforeEngineer) : ""}
                />
                <TextField disabled label="생년월일" size="small" sx={standardFieldSx} value={formatBirthDate(draft?.beforeEngineer?.birthDate)} />
              </Box>
              <EngineerParticipationInputs
                fieldName="beforeField"
                initialField={draft?.beforeField ?? ""}
                initialParticipationType={draft?.beforeParticipationType ?? ""}
                participationTypeName="beforeParticipationType"
              />
              <Box sx={participationFieldsSx}>
                <DateInput
                  label="참여시작일"
                  mode="date"
                  onChange={(value) =>
                    onDraftChange((current) => current ? { ...current, historyParticipationStartDate: value } : current)
                  }
                  size="small"
                  sx={standardFieldSx}
                  value={draft?.historyParticipationStartDate ?? ""}
                />
                <DateInput
                  label="참여종료일"
                  mode="date"
                  onChange={(value) =>
                    onDraftChange((current) => current ? { ...current, historyParticipationEndDate: value } : current)
                  }
                  size="small"
                  sx={standardFieldSx}
                  value={draft?.historyParticipationEndDate ?? ""}
                />
              </Box>
            </Box>
            <Box
              sx={(theme) => ({
                ...engineerSectionSx,
                borderColor: alpha(theme.palette.primary.main, 0.3),
              })}
            >
              <Typography
                component="h3"
                sx={(theme) => ({
                  ...engineerSectionHeadingSx,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.dark",
                })}
              >
                <HowToRegOutlinedIcon fontSize="small" />
                변경 후 기술인
              </Typography>
              <Box sx={engineerIdentitySx}>
                <Autocomplete
                  autoHighlight
                  disablePortal
                  fullWidth
                  getOptionLabel={engineerLabel}
                  isOptionEqualToValue={(option, value) => option.engineerId === value.engineerId}
                  loading={loading}
                  onChange={(_event, nextValue) =>
                    onDraftChange((current) => current ? { ...current, afterEngineer: nextValue } : current)
                  }
                  onInputChange={(_event, nextInputValue, reason) => {
                    if (reason === "input") {
                      onSearch(nextInputValue);
                    }
                  }}
                  options={options}
                  renderInput={(params) => <TextField {...params} label="기술인" required size="small" sx={standardFieldSx} />}
                  renderOption={({ key, ...optionProps }, option) => (
                    <li key={key} {...optionProps}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1, width: "100%" }}>
                        <Typography component="span" variant="body2" sx={{ flexGrow: 1 }}>
                          {engineerLabel(option)}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {formatBirthDate(option.birthDate) || "미등록"}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  value={draft?.afterEngineer ?? null}
                />
                <TextField disabled label="생년월일" size="small" sx={standardFieldSx} value={formatBirthDate(draft?.afterEngineer?.birthDate)} />
              </Box>
              <EngineerParticipationInputs
                fieldName="field"
                initialField={draft?.field ?? ""}
                initialParticipationType={draft?.participationType ?? ""}
                participationTypeName="participationType"
              />
              <Box sx={participationFieldsSx}>
                <DateInput
                  label="참여시작일"
                  onChange={(value) => onDraftChange((current) => (current ? { ...current, participationDate: value } : current))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft?.participationDate ?? ""}
                />
                <DateInput
                  label="참여종료일"
                  onChange={(value) =>
                    onDraftChange((current) => (current ? { ...current, participationEndDate: value } : current))
                  }
                  size="small"
                  sx={standardFieldSx}
                  value={draft?.participationEndDate ?? ""}
                />
              </Box>
            </Box>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(draft?.pqTargetYn)}
                onChange={(_event, checked) => onDraftChange((current) => (current ? { ...current, pqTargetYn: checked } : current))}
                size="small"
              />
            }
            label="PQ대상자"
            sx={{ alignSelf: "flex-start", minHeight: 40, mx: 0 }}
          />
          <TextField
            defaultValue={draft?.initialRemark ?? ""}
            label="비고"
            multiline
            minRows={2}
            name="remark"
            size="small"
            sx={standardFieldSx}
          />
          <TextField
            label="변경내용"
            multiline
            minRows={3}
            name="changeContent"
            onChange={(event) => setHasChangeContent(Boolean(event.target.value.trim()))}
            required={engineerChanged}
            size="small"
            sx={standardFieldSx}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined">
          취소
        </Button>
        <Button disabled={saveDisabled} form={formId} type="submit" startIcon={<SaveOutlinedIcon />} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
