"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

import { standardFieldSx } from "@/components/common/FormControls";
import { useCommonCodeLevel2Options } from "@/modules/common/reference/useReferenceOptions";
import { CompanyPerformanceContractPeriodsGrid } from "@/modules/pq/company-performance/CompanyPerformanceContractPeriodsGrid";
import { CompanyPerformanceDetailTabs } from "@/modules/pq/company-performance/detail-tabs/CompanyPerformanceDetailTabs";
import type { CompanyPerformanceRecord } from "@/modules/pq/company-performance/api";

export type CompanyPerformanceCodeOption = {
  label: string;
  value: string;
};

type DetailDialogProps = {
  businessTypeOptions: CompanyPerformanceCodeOption[];
  clientKindOptions: CompanyPerformanceCodeOption[];
  jobFinishOptions: CompanyPerformanceCodeOption[];
  deleteDisabled: boolean;
  onClose: () => void;
  onDelete: () => void;
  onFieldChange: <K extends keyof CompanyPerformanceRecord>(field: K, value: CompanyPerformanceRecord[K]) => void;
  onSave: () => void;
  open: boolean;
  record: CompanyPerformanceRecord;
  saveDisabled: boolean;
  showDeleteButton?: boolean;
  showSaveButton?: boolean;
  readOnly?: boolean;
};

const text = (value: string | null | undefined) => value ?? "";

const toNullableNumber = (value: string) => {
  const normalized = value.replaceAll(",", "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDivisionRateValue = (value: string) => {
  const normalized = value.replace(/\D/g, "");
  if (!normalized) {
    return null;
  }

  return Math.min(Number(normalized), 100);
};

const toMoneyText = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : new Intl.NumberFormat("ko-KR").format(value);

const toDateInputValue = (value: string | null | undefined) => {
  const normalized = text(value).trim();
  if (normalized.length === 8) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  return normalized;
};

const toContractDateValue = (value: string) => {
  const normalized = value.trim();
  return normalized ? normalized.replaceAll("-", "") : null;
};

const isStoppedStatus = (value: string | null | undefined) => text(value).trim().toUpperCase() === "N";
const showCodeLabel = process.env.NEXT_PUBLIC_APP_PROFILE !== "prod";

function Panel({ children, fillHeight = false, title }: { children: ReactNode; fillHeight?: boolean; title: string }) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, display: fillHeight ? "flex" : undefined, flexDirection: fillHeight ? "column" : undefined, height: fillHeight ? "100%" : undefined, minWidth: 0, overflow: "hidden" }}>
      <Box sx={{ bgcolor: "#eef4fb", borderBottom: "1px solid", borderColor: "divider", px: 1.5, py: 1 }}>
        <Typography sx={{ color: "#0f172a", fontSize: 13, fontWeight: 800 }}>{title}</Typography>
      </Box>
      <Box sx={{ display: fillHeight ? "flex" : undefined, flex: fillHeight ? 1 : undefined, flexDirection: fillHeight ? "column" : undefined, minHeight: fillHeight ? 0 : undefined, p: 1.25 }}>{children}</Box>
    </Box>
  );
}

function Group({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Box
      sx={{
        bgcolor: "#f8fafc",
        border: "1px solid",
        borderColor: "#dbe3ee",
        borderRadius: 1,
        display: "grid",
        gap: 0.75,
        p: 1,
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
        <Box sx={{ bgcolor: "#2563eb", borderRadius: 0.5, height: 14, width: 4 }} />
        <Typography sx={{ color: "#0f172a", fontSize: 13, fontWeight: 900 }}>{title}</Typography>
      </Box>
      <Box sx={{ display: "grid", gap: 0.75 }}>{children}</Box>
    </Box>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "grid", gap: 0.5, gridTemplateColumns: "82px minmax(0, 1fr)", minWidth: 0 }}>
      <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>{label}</Typography>
      {children}
    </Box>
  );
}

function CodeSelect({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: CompanyPerformanceCodeOption[];
  value: string;
}) {
  const hasValue = !value || options.some((option) => option.value === value);
  const optionLabel = (option: CompanyPerformanceCodeOption) => (showCodeLabel ? `${option.value} - ${option.label}` : option.label);

  return (
    <TextField onChange={(event) => onChange(event.target.value)} select size="small" sx={standardFieldSx} value={value}>
      <MenuItem value="">선택</MenuItem>
      {!hasValue ? <MenuItem value={value}>{value}</MenuItem> : null}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {optionLabel(option)}
        </MenuItem>
      ))}
    </TextField>
  );
}

function MoneyField({
  onChange,
  value,
}: {
  onChange: (value: number | null) => void;
  value: number | null | undefined;
}) {
  return (
    <TextField
      onChange={(event) => onChange(toNullableNumber(event.target.value))}
      size="small"
      slotProps={{ input: { endAdornment: <InputAdornment position="end">원</InputAdornment> } }}
      sx={standardFieldSx}
      value={toMoneyText(value)}
    />
  );
}

function CompactSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(_event, nextChecked) => onChange(nextChecked)} size="small" />}
      label={label}
      sx={{ m: 0, "& .MuiFormControlLabel-label": { color: "text.secondary", fontSize: 13, fontWeight: 700 } }}
    />
  );
}

export function CompanyPerformanceDetailDialog({
  businessTypeOptions,
  clientKindOptions,
  jobFinishOptions,
  deleteDisabled,
  onClose,
  onDelete,
  onFieldChange,
  onSave,
  open,
  record,
  readOnly = false,
  saveDisabled,
  showDeleteButton = true,
  showSaveButton = true,
}: DetailDialogProps) {
  const showStopDate = isStoppedStatus(record.jobFinishYn);
  const serviceTypeReferences = useCommonCodeLevel2Options("ST", { useYn: "Y" }, { enabled: open });

  return (
    <Dialog fullWidth maxWidth="xl" onClose={onClose} open={open}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", gap: 2, justifyContent: "space-between", px: 2, py: 1.25 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 800 }}>회사 실적 상세</Typography>
          <Typography color="text.secondary" noWrap variant="body2">
            {record.seq ? record.jobName || "-" : "신규 회사 실적"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "background.default", p: 1.5 }}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "minmax(620px, 1.25fr) minmax(360px, 0.75fr)" } }}>
          <Panel title="주요 정보">
            <Box sx={{ display: "grid", gap: 1.25 }}>
              <Group title="기본">
                <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 180px" } }}>
                  <Field label="용역명">
                    <TextField onChange={(event) => onFieldChange("jobName", event.target.value)} size="small" sx={standardFieldSx} value={text(record.jobName)} />
                  </Field>
                  <Field label="용역차수">
                    <TextField
                      onChange={(event) => onFieldChange("jobSeq", toNullableNumber(event.target.value))}
                      size="small"
                      slotProps={{ htmlInput: { max: 999, min: 0 } }}
                      sx={standardFieldSx}
                      type="number"
                      value={record.jobSeq ?? ""}
                    />
                  </Field>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gap: 0.75,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: showStopDate ? "1.35fr 0.65fr 0.8fr" : "1.35fr 0.65fr",
                    },
                  }}
                >
                  <Field label="계약기간">
                    <Box sx={{ alignItems: "center", display: "grid", gap: 0.5, gridTemplateColumns: "1fr 10px 1fr" }}>
                      <TextField
                        onChange={(event) => onFieldChange("contractFromDate", toContractDateValue(event.target.value))}
                        size="small"
                        sx={standardFieldSx}
                        type="date"
                        value={toDateInputValue(record.contractFromDate)}
                      />
                      <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                        -
                      </Typography>
                      <TextField
                        onChange={(event) => onFieldChange("contractToDate", toContractDateValue(event.target.value))}
                        size="small"
                        sx={standardFieldSx}
                        type="date"
                        value={toDateInputValue(record.contractToDate)}
                      />
                    </Box>
                  </Field>
                  <Field label="진행상태">
                    <CodeSelect onChange={(value) => onFieldChange("jobFinishYn", value)} options={jobFinishOptions} value={text(record.jobFinishYn)} />
                  </Field>
                  {showStopDate ? (
                    <Field label="중지일">
                      <TextField
                        onChange={(event) => onFieldChange("stopDate", toContractDateValue(event.target.value))}
                        size="small"
                        sx={standardFieldSx}
                        type="date"
                        value={toDateInputValue(record.stopDate)}
                      />
                    </Field>
                  ) : null}
                </Box>

                <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                  <Field label="자사/타사">
                    <TextField
                      onChange={(event) => onFieldChange("jobOwnYn", event.target.value === "Y")}
                      select
                      size="small"
                      sx={standardFieldSx}
                      value={record.jobOwnYn ? "Y" : "N"}
                    >
                      <MenuItem value="Y">자사</MenuItem>
                      <MenuItem value="N">타사</MenuItem>
                    </TextField>
                  </Field>
                  <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, minHeight: 36 }}>
                    <CompactSwitch checked={record.generalManagementYn} label="총괄" onChange={(checked) => onFieldChange("generalManagementYn", checked)} />
                    <CompactSwitch checked={record.overseeYn} label="해외" onChange={(checked) => onFieldChange("overseeYn", checked)} />
                  </Box>
                </Box>

                <CompanyPerformanceContractPeriodsGrid readOnly={readOnly || !showSaveButton} record={record} />
              </Group>

              <Group title="분류">
                <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                  <Field label="사업유형">
                    <CodeSelect onChange={(value) => onFieldChange("businessType", value)} options={businessTypeOptions} value={text(record.businessType)} />
                  </Field>
                  <Field label="용역구분">
                    <CodeSelect onChange={(value) => onFieldChange("jobType", value)} options={serviceTypeReferences.options} value={text(record.jobType)} />
                  </Field>
                </Box>

                <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                  <Field label="발주처">
                    <TextField onChange={(event) => onFieldChange("orderClient", event.target.value)} size="small" sx={standardFieldSx} value={text(record.orderClient)} />
                  </Field>
                  <Field label="발주처구분">
                    <CodeSelect onChange={(value) => onFieldChange("clientKind", value)} options={clientKindOptions} value={text(record.clientKind)} />
                  </Field>
                </Box>
              </Group>

              <Group title="금액">
                <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                  <Field label="총계약금액">
                    <MoneyField onChange={(value) => onFieldChange("contractAmt", value)} value={record.contractAmt} />
                  </Field>
                  <Field label="당사금액">
                    <MoneyField onChange={(value) => onFieldChange("ownAmt", value)} value={record.ownAmt} />
                  </Field>
                </Box>

                <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                  <Field label="지분율">
                    <TextField
                      onChange={(event) => onFieldChange("divisionRate", toDivisionRateValue(event.target.value))}
                      size="small"
                      slotProps={{ htmlInput: { inputMode: "numeric", max: 100, min: 0 }, input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                      sx={standardFieldSx}
                      value={record.divisionRate ?? ""}
                    />
                  </Field>
                  <Field label="공동도급비율">
                    <TextField onChange={(event) => onFieldChange("jobRatio", event.target.value)} size="small" sx={standardFieldSx} value={text(record.jobRatio)} />
                  </Field>
                </Box>
              </Group>

              <Group title="기타">
                <Field label="비고">
                  <TextField minRows={2} multiline onChange={(event) => onFieldChange("remark", event.target.value)} sx={standardFieldSx} value={text(record.remark)} />
                </Field>
              </Group>
            </Box>
          </Panel>

          <Panel fillHeight title="공사개요">
            <TextField
              fullWidth
              multiline
              onChange={(event) => onFieldChange("summary", event.target.value)}
              sx={{
                ...standardFieldSx,
                flex: 1,
                minHeight: 0,
                "& .MuiInputBase-root": {
                  alignItems: "flex-start",
                  height: "100%",
                },
                "& textarea": {
                  height: "100% !important",
                  overflowY: "auto !important",
                },
              }}
              value={text(record.summary)}
            />
          </Panel>
        </Box>

        <CompanyPerformanceDetailTabs key={record.seq || "new"} readOnly={readOnly || !showSaveButton} record={record} />
      </DialogContent>

      <DialogActions sx={{ p: 1.5 }}>
        <Button color="error" disabled={deleteDisabled} onClick={onDelete} startIcon={<DeleteOutlineOutlinedIcon />} sx={{ display: showDeleteButton ? undefined : "none" }} variant="outlined">
          삭제
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="outlined">
          닫기
        </Button>
        <Button disabled={saveDisabled} onClick={onSave} startIcon={<SaveOutlinedIcon />} sx={{ display: showSaveButton ? undefined : "none" }} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
