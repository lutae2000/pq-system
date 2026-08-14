"use client";

import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Paper, Typography } from "@mui/material";
import type { GridRenderCellParams } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";

import { listCertifications } from "@/modules/code/certifications/api";
import { formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import type {
  AwardHistoryTabProps,
  CareerHistoryTabProps,
  CertificateHistoryTabProps,
  EducationHistoryTabProps,
  TrainingHistoryTabProps,
} from "@/modules/pq/engineers/history-tabs/historyTabTypes";
import { AwardHistoryTab } from "@/modules/pq/engineers/history-tabs/AwardHistoryTab";
import { CareerHistoryTab } from "@/modules/pq/engineers/history-tabs/CareerHistoryTab";
import { CertificateHistoryTab } from "@/modules/pq/engineers/history-tabs/CertificateHistoryTab";
import { EducationHistoryTab } from "@/modules/pq/engineers/history-tabs/EducationHistoryTab";
import { TrainingHistoryTab } from "@/modules/pq/engineers/history-tabs/TrainingHistoryTab";
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

type EngineerHistorySummaryDialogProps = {
  awardTabProps: AwardHistoryTabProps;
  certificateTabProps: CertificateHistoryTabProps;
  certificateLabelByValue?: Record<string, string>;
  careerTabProps: CareerHistoryTabProps;
  educationTabProps: EducationHistoryTabProps;
  engineer?: EngineerProfile | null;
  open: boolean;
  onClose: () => void;
  selectedJobFieldLabel?: string;
  selectedQualificationGradeLabel?: string;
  selectedSpecialtyFieldLabel?: string;
  selectedSupervisionQualificationLabel?: string;
  selectedTechnicalFieldLabel?: string;
  selectedWorkFieldLabel?: string;
  trainingTabProps: TrainingHistoryTabProps;
};

type SummaryTextLabels = Pick<
  EngineerHistorySummaryDialogProps,
  | "selectedJobFieldLabel"
  | "selectedQualificationGradeLabel"
  | "selectedSpecialtyFieldLabel"
  | "selectedSupervisionQualificationLabel"
  | "selectedTechnicalFieldLabel"
  | "selectedWorkFieldLabel"
> & {
  certificateLabelByValue?: Record<string, string>;
  degreeLabelByValue?: Record<string, string>;
};

function text(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  const normalized = String(value).trim();
  return normalized ? normalized : "-";
}

function getFallbackCopyContainer() {
  if (document.activeElement instanceof HTMLElement) {
    return document.activeElement.closest('[role="dialog"]') ?? document.body;
  }
  return document.body;
}

function fallbackCopyPlainText(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  const container = getFallbackCopyContainer();
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  container.appendChild(textarea);

  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");
    if (!copied) {
      throw new Error("Clipboard copy failed");
    }
  } finally {
    container.removeChild(textarea);
    activeElement?.focus({ preventScroll: true });
  }
}

async function copyPlainText(value: string) {
  if (!window.isSecureContext || !navigator.clipboard?.writeText) {
    fallbackCopyPlainText(value);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
  } catch {
    fallbackCopyPlainText(value);
  }
}

function date8(value: string | null | undefined) {
  const normalized = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (normalized.length !== 8) {
    return text(value);
  }
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
}

function labelOrValue(label: string | null | undefined, value: string | number | boolean | null | undefined) {
  const normalizedLabel = String(label ?? "").trim();
  return normalizedLabel || text(value);
}

function labelByValue(labels: Record<string, string> | undefined, value: string | number | boolean | null | undefined) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) {
    return "-";
  }
  return labels?.[normalizedValue] || normalizedValue;
}

function labelFromMap(labels: Record<string, string>, value: string | number | boolean | null | undefined) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue ? labels[normalizedValue] || normalizedValue : "-";
}

function mergeLabels(...labels: Array<Record<string, string> | undefined>) {
  return Object.assign({}, ...labels);
}

function buildOptionLabelByValue(columns: EducationHistoryTabProps["educationGridColumns"], field: string) {
  const column = columns.find((item) => item.field === field);
  const valueOptions = column && "valueOptions" in column ? column.valueOptions : undefined;
  if (!Array.isArray(valueOptions)) {
    return {};
  }

  return Object.fromEntries(
    valueOptions.flatMap((option) => {
      if (typeof option === "string" || typeof option === "number") {
        return [[String(option), String(option)]];
      }
      if (!option || typeof option !== "object" || !("value" in option) || !("label" in option)) {
        return [];
      }

      const value = String(option.value ?? "").trim();
      const label = String(option.label ?? "").trim();
      return value && label ? [[value, label]] : [];
    }),
  );
}

function buildRows<T>(items: T[], formatter: (item: T, index: number) => string) {
  if (items.length === 0) {
    return ["없음"];
  }
  return items.map((item, index) => `${index + 1}. ${formatter(item, index)}`);
}

function buildSummaryText(
  engineer?: EngineerProfile | null,
  labels?: SummaryTextLabels,
) {
  if (!engineer) {
    return "";
  }

  const blocks = [
    [
      "[기본정보]",
      `성명: ${text(engineer.summary.name)}`,
      `사번: ${text(engineer.summary.id)}`,
      `생년월일: ${date8(engineer.detail.birthDate)}`,
      `나이: ${text(engineer.detail.age ? `${engineer.detail.age}세` : "")}`,
      `부서: ${text(engineer.summary.department)}`,
      `직위: ${text(engineer.summary.position)}`,
      `직무분야: ${labelOrValue(labels?.selectedWorkFieldLabel, engineer.summary.workField)}`,
      `직무분야 상세: ${labelOrValue(labels?.selectedJobFieldLabel, engineer.detail.jobField)}`,
      `전문분야: ${labelOrValue(labels?.selectedSpecialtyFieldLabel, engineer.detail.specialtyField)}`,
      `자격등급: ${labelOrValue(labels?.selectedQualificationGradeLabel, engineer.detail.qualificationGrade)}`,
      `기술등급: ${labelOrValue(labels?.selectedTechnicalFieldLabel, engineer.detail.technicalField)}`,
      `건설사업관리 등급: ${labelOrValue(labels?.selectedSupervisionQualificationLabel, engineer.detail.supervisionQualification)}`,
      `상태: ${text(engineer.summary.status)}`,
    ],
    [
      "[경력]",
      ...buildRows(engineer.career, (row) =>
        [`${date8(row.startDate)} ~ ${date8(row.endDate)}`, text(row.company), text(row.department), text(row.position), text(row.jobDuty)].join(" | "),
      ),
    ],
    [
      "[자격증]",
      ...buildRows(engineer.certificates, (row) => [date8(row.issueDate), labelByValue(labels?.certificateLabelByValue, row.certificateName), text(row.licenseNo)].join(" | ")),
    ],
    [
      "[학력]",
      ...buildRows(engineer.education, (row) =>
        [date8(row.endDate), text(row.schoolName), text(row.major), labelByValue(labels?.degreeLabelByValue, row.degree), `관련학과: ${text(row.validMajorYn)}`].join(" | "),
      ),
    ],
    [
      "[교육훈련]",
      ...buildRows(engineer.trainings, (row) =>
        [`${date8(row.startDate)} ~ ${date8(row.endDate)}`, text(row.trainingName), text(row.institution), `${text(row.hours)}시간`].join(" | "),
      ),
    ],
    [
      "[상훈 / 제재]",
      ...buildRows(engineer.awards, (row) => [date8(row.issueDate), text(row.category), text(row.kind), text(row.agency), text(row.businessName), text(row.basis)].join(" | ")),
    ],
  ];

  return blocks.map((block) => block.join("\n")).join("\n\n");
}

function SectionFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, p: 1.25 }}>
      <Typography sx={{ fontWeight: 800, mb: 0.75 }} variant="subtitle2">
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "grid", gap: 0.15 }}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ wordBreak: "break-word" }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}

export function EngineerHistorySummaryDialog({
  awardTabProps,
  certificateTabProps,
  certificateLabelByValue,
  careerTabProps,
  educationTabProps,
  engineer,
  open,
  onClose,
  selectedJobFieldLabel,
  selectedQualificationGradeLabel,
  selectedSpecialtyFieldLabel,
  selectedSupervisionQualificationLabel,
  selectedTechnicalFieldLabel,
  selectedWorkFieldLabel,
  trainingTabProps,
}: EngineerHistorySummaryDialogProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: open });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: open });
  const degreeReferences = useCommonCodeLevel2Options("ED", { useYn: "Y" }, { enabled: open });
  const certificationsQuery = useQuery({
    queryKey: ["code-certifications", "summary-dialog"],
    queryFn: listCertifications,
    enabled: open,
  });
  const certificateReferenceLabels = useMemo(
    () => Object.fromEntries((certificationsQuery.data ?? []).map((item) => [item.certCode, item.certName])),
    [certificationsQuery.data],
  );
  const degreeColumnLabels = useMemo(
    () => buildOptionLabelByValue(educationTabProps.educationGridColumns, "degree"),
    [educationTabProps.educationGridColumns],
  );
  const jobFieldLabelByValue = jobFieldReferences.labelByValue;
  const specialtyFieldLabelByValue = specialtyFieldReferences.labelByValue;
  const certificateLabels = useMemo(
    () => mergeLabels(certificateLabelByValue, certificateReferenceLabels),
    [certificateLabelByValue, certificateReferenceLabels],
  );
  const degreeLabels = useMemo(
    () => mergeLabels(degreeColumnLabels, degreeReferences.labelByValue),
    [degreeColumnLabels, degreeReferences.labelByValue],
  );
  const workFieldLabel = selectedWorkFieldLabel || formatReferenceLabel(jobFieldLabelByValue, engineer?.summary.workField ?? "");
  const jobFieldLabel = selectedJobFieldLabel || formatReferenceLabel(jobFieldLabelByValue, engineer?.detail.jobField ?? "");
  const specialtyFieldLabel = selectedSpecialtyFieldLabel || formatReferenceLabel(specialtyFieldLabelByValue, engineer?.detail.specialtyField ?? "");
  const certificateGridColumns = useMemo(
    () =>
      certificateTabProps.certificateGridColumns.map((column) =>
        column.field === "certificateName"
          ? {
              ...column,
              renderCell: (params: GridRenderCellParams) => labelFromMap(certificateLabels, params.value),
            }
          : column,
      ),
    [certificateLabels, certificateTabProps.certificateGridColumns],
  );
  const educationGridColumns = useMemo(
    () =>
      educationTabProps.educationGridColumns.map((column) =>
        column.field === "degree"
          ? {
              ...column,
              renderCell: (params: GridRenderCellParams) => labelFromMap(degreeLabels, params.value),
            }
          : column,
      ),
    [degreeLabels, educationTabProps.educationGridColumns],
  );
  const summaryText = useMemo(
    () =>
      buildSummaryText(engineer, {
        certificateLabelByValue: certificateLabels,
        degreeLabelByValue: degreeLabels,
        selectedJobFieldLabel: jobFieldLabel,
        selectedQualificationGradeLabel,
        selectedSpecialtyFieldLabel: specialtyFieldLabel,
        selectedSupervisionQualificationLabel,
        selectedTechnicalFieldLabel,
        selectedWorkFieldLabel: workFieldLabel,
      }),
    [
      certificateLabels,
      degreeLabels,
      engineer,
      jobFieldLabel,
      selectedQualificationGradeLabel,
      specialtyFieldLabel,
      selectedSupervisionQualificationLabel,
      selectedTechnicalFieldLabel,
      workFieldLabel,
    ],
  );

  const handleCopy = async () => {
    try {
      await copyPlainText(summaryText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1500);
    }
  };

  return (
    <Dialog fullWidth maxWidth="xl" onClose={onClose} open={open} slotProps={{ paper: { sx: { height: { xs: "100%", md: "90vh" } } } }}>
      <DialogTitle sx={{ pb: 1.25 }}>
        <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2, justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              인사이력 요약
            </Typography>
          </Box>
          <Button onClick={handleCopy} startIcon={<ContentCopyOutlinedIcon />} variant="outlined">
            {copyState === "copied" ? "복사됨" : copyState === "error" ? "복사 실패" : "전체 복사"}
          </Button>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ overflow: "auto", p: 1.5 }}>
        <Grid container spacing={1.25}>
          <Grid size={12}>
            <SectionFrame title="기본정보">
              <Grid container spacing={0.75}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="성명" value={text(engineer?.summary.name)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="생년월일" value={date8(engineer?.detail.birthDate)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="나이" value={text(engineer?.detail.age ? `${engineer.detail.age}세` : "")} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="부서" value={text(engineer?.summary.department)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="직위" value={text(engineer?.summary.position)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="직무분야" value={labelOrValue(workFieldLabel, engineer?.summary.workField)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="직무분야 상세" value={labelOrValue(jobFieldLabel, engineer?.detail.jobField)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="전문분야" value={labelOrValue(specialtyFieldLabel, engineer?.detail.specialtyField)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="자격등급" value={labelOrValue(selectedQualificationGradeLabel, engineer?.detail.qualificationGrade)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="기술등급" value={labelOrValue(selectedTechnicalFieldLabel, engineer?.detail.technicalField)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField
                    label="건설사업관리 등급"
                    value={labelOrValue(selectedSupervisionQualificationLabel, engineer?.detail.supervisionQualification)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoField label="상태" value={text(engineer?.summary.status)} />
                </Grid>
              </Grid>
            </SectionFrame>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <SectionFrame title="경력">
              <CareerHistoryTab {...careerTabProps} readOnly />
            </SectionFrame>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionFrame title="자격증">
              <CertificateHistoryTab {...certificateTabProps} certificateGridColumns={certificateGridColumns} readOnly />
            </SectionFrame>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionFrame title="학력">
              <EducationHistoryTab {...educationTabProps} educationGridColumns={educationGridColumns} readOnly />
            </SectionFrame>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionFrame title="교육훈련">
              <TrainingHistoryTab {...trainingTabProps} readOnly />
            </SectionFrame>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionFrame title="상훈 / 제재">
              <AwardHistoryTab {...awardTabProps} readOnly />
            </SectionFrame>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
