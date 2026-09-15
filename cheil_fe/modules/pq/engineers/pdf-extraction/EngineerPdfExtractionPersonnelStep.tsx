"use client";

import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Alert, Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import { toSelectOptions, type SelectOption } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import {
  ExtractionGrid,
  normalizeExtractionSections,
  personnelSections,
  SectionFrame,
} from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionReviewShared";
import { discardMergedExtractionRow, markMergedRowsPersisted, PDF_MERGE_STATUS_FIELD } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionMerge";
import type { EngineerPdfExtraction, EngineerPdfExtractionRow } from "@/modules/pq/engineers/pdf-extraction/pdfExtractionApi";

type Props = {
  active: boolean;
  certificationNameByCode: ReadonlyMap<string, string>;
  degreeNameByCode: ReadonlyMap<string, string>;
  disabled?: boolean;
  mode?: "new" | "update";
  onRegister: (result: EngineerPdfExtraction) => Promise<void>;
  onUpdateBasic?: (result: EngineerPdfExtraction) => Promise<void>;
  onUpsertSection?: (sectionKey: string, rows: EngineerPdfExtractionRow[]) => Promise<void>;
  open: boolean;
  result: EngineerPdfExtraction;
};

const emptyBasic: EngineerPdfExtraction["basic"] = {
  name: "",
  birthDate: "",
  department: "",
  position: "",
  workField: "",
  specialtyField: "",
  designGrade: "",
  constructionManagementGrade: "",
};

function normalizeReferenceText(value: string) {
  return value.normalize("NFKC").replace(/[^\p{L}\p{N}]/gu, "").toLocaleLowerCase();
}

function resolveReferenceOption(options: SelectOption[], value: string) {
  const normalized = normalizeReferenceText(value);
  if (!normalized) return null;
  return options.find((option) => normalizeReferenceText(option.value) === normalized || normalizeReferenceText(option.label) === normalized) ?? null;
}

export function EngineerPdfExtractionPersonnelStep({ active, certificationNameByCode, degreeNameByCode, disabled = false, mode = "new", onRegister, onUpdateBasic, onUpsertSection, open, result }: Props) {
  const [basic, setBasic] = useState<Partial<EngineerPdfExtraction["basic"]>>({});
  const [sectionEdits, setSectionEdits] = useState<Record<string, EngineerPdfExtractionRow[]>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [savingSection, setSavingSection] = useState("");
  const [pendingUpdate, setPendingUpdate] = useState<{ key: string; label: string; rows?: EngineerPdfExtractionRow[] } | null>(null);
  const gradeReferences = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: open });
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: open });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: open });
  const gradeOptions = useMemo(() => toSelectOptions(gradeReferences.options), [gradeReferences.options]);
  const jobFieldOptions = useMemo(() => toSelectOptions(jobFieldReferences.options), [jobFieldReferences.options]);
  const specialtyFieldOptions = useMemo(() => toSelectOptions(specialtyFieldReferences.options), [specialtyFieldReferences.options]);
  const displayBasic = { ...emptyBasic, ...result.basic, ...basic };
  const matchedDesignGrade = resolveReferenceOption(gradeOptions, displayBasic.designGrade);
  const matchedConstructionManagementGrade = resolveReferenceOption(gradeOptions, displayBasic.constructionManagementGrade);
  const matchedJobField = resolveReferenceOption(jobFieldOptions, displayBasic.workField);
  const matchedSpecialtyField = resolveReferenceOption(specialtyFieldOptions, displayBasic.specialtyField);
  const hasReferenceMismatch = Boolean(
    (displayBasic.designGrade && !matchedDesignGrade)
    || (displayBasic.constructionManagementGrade && !matchedConstructionManagementGrade)
    || (displayBasic.workField && !matchedJobField)
    || (displayBasic.specialtyField && !matchedSpecialtyField),
  );
  const updateBasic = (field: keyof EngineerPdfExtraction["basic"], value: string) => setBasic((current) => ({ ...current, [field]: value }));

  const reviewedResult = (): EngineerPdfExtraction => ({
      ...result,
      basic: {
        ...displayBasic,
        designGrade: matchedDesignGrade?.value ?? "",
        constructionManagementGrade: matchedConstructionManagementGrade?.value ?? "",
        workField: matchedJobField?.value ?? "",
        specialtyField: matchedSpecialtyField?.value ?? "",
      },
      sections: normalizeExtractionSections({ ...result.sections, ...sectionEdits }),
  });

  const register = async () => {
    await onRegister(reviewedResult());
  };

  const updateBasicInfo = async () => {
    if (!onUpdateBasic) return;
    setSavingSection("basic");
    try {
      await onUpdateBasic(reviewedResult());
    } catch {
      return;
    } finally {
      setSavingSection("");
    }
  };

  const upsertSection = async (sectionKey: string, rows: EngineerPdfExtractionRow[]) => {
    if (!onUpsertSection) return;
    setSavingSection(sectionKey);
    try {
      const normalized = normalizeExtractionSections({ [sectionKey]: rows })[sectionKey] ?? [];
      await onUpsertSection(sectionKey, normalized);
      setSectionEdits((current) => ({ ...current, [sectionKey]: markMergedRowsPersisted(rows) }));
    } catch {
      return;
    } finally {
      setSavingSection("");
    }
  };

  if (!active) return null;

  return <Box>
    {mode === "update" ? (
      <Alert severity="info" sx={{ mb: 1.25 }}>
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Typography variant="body2"><Box component="span" sx={{ bgcolor: "rgba(244, 67, 54, 0.18)", display: "inline-block", height: 12, mr: 0.5, width: 18 }} />빨간색: 동일 명칭의 업데이트 대상</Typography>
          <Typography variant="body2"><Box component="span" sx={{ bgcolor: "rgba(255, 193, 7, 0.25)", display: "inline-block", height: 12, mr: 0.5, width: 18 }} />노란색: 신규 추가 대상</Typography>
        </Stack>
      </Alert>
    ) : null}
    {hasReferenceMismatch ? <Alert severity="warning" sx={{ mb: 1.25 }}>등급, 직무분야 또는 전문분야의 추출값과 일치하는 공통코드가 없습니다. 해당 항목을 직접 선택해 주세요.</Alert> : null}
    <SectionFrame
      title="기본정보"
      actions={mode === "update" ? <Button disabled={disabled || savingSection !== "" || !displayBasic.name || !displayBasic.birthDate} size="small" startIcon={<SaveOutlinedIcon />} variant="contained" onClick={() => setPendingUpdate({ key: "basic", label: "기본정보" })}>기본정보 업데이트</Button> : undefined}
    >
      <Grid container spacing={0.75} sx={{ p: 0.75 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth label="성명" size="small" value={displayBasic.name} onChange={(event) => updateBasic("name", event.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth label="생년월일" size="small" type="date" value={displayBasic.birthDate} onChange={(event) => updateBasic("birthDate", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth label="부서" size="small" value={displayBasic.department} onChange={(event) => updateBasic("department", event.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth label="직위" size="small" value={displayBasic.position} onChange={(event) => updateBasic("position", event.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><Autocomplete fullWidth options={jobFieldOptions} getOptionLabel={(option) => option.label} isOptionEqualToValue={(option, value) => option.value === value.value} value={matchedJobField} onChange={(_, option) => updateBasic("workField", option?.value ?? "")} renderInput={(params) => <TextField {...params} error={Boolean(displayBasic.workField && !matchedJobField)} helperText={displayBasic.workField && !matchedJobField ? `추출값: ${displayBasic.workField}` : undefined} label="직무분야" size="small" />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><Autocomplete fullWidth options={specialtyFieldOptions} getOptionLabel={(option) => option.label} isOptionEqualToValue={(option, value) => option.value === value.value} value={matchedSpecialtyField} onChange={(_, option) => updateBasic("specialtyField", option?.value ?? "")} renderInput={(params) => <TextField {...params} error={Boolean(displayBasic.specialtyField && !matchedSpecialtyField)} helperText={displayBasic.specialtyField && !matchedSpecialtyField ? `추출값: ${displayBasic.specialtyField}` : undefined} label="전문분야" size="small" />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><Autocomplete fullWidth options={gradeOptions} getOptionLabel={(option) => option.label} isOptionEqualToValue={(option, value) => option.value === value.value} value={matchedDesignGrade} onChange={(_, option) => updateBasic("designGrade", option?.value ?? "")} renderInput={(params) => <TextField {...params} error={Boolean(displayBasic.designGrade && !matchedDesignGrade)} helperText={displayBasic.designGrade && !matchedDesignGrade ? `추출값: ${displayBasic.designGrade}` : undefined} label="설계 등급" size="small" />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><Autocomplete fullWidth options={gradeOptions} getOptionLabel={(option) => option.label} isOptionEqualToValue={(option, value) => option.value === value.value} value={matchedConstructionManagementGrade} onChange={(_, option) => updateBasic("constructionManagementGrade", option?.value ?? "")} renderInput={(params) => <TextField {...params} error={Boolean(displayBasic.constructionManagementGrade && !matchedConstructionManagementGrade)} helperText={displayBasic.constructionManagementGrade && !matchedConstructionManagementGrade ? `추출값: ${displayBasic.constructionManagementGrade}` : undefined} label="건설사업관리 등급" size="small" />} /></Grid>
      </Grid>
    </SectionFrame>
    <Grid container spacing={1.25} sx={{ mt: 0 }}>
      {personnelSections.map(({ key, label }) => {
        const rows = sectionEdits[key] ?? result.sections[key] ?? [];
        const changedCount = rows.filter((row) => ["insert", "update"].includes(row.values[PDF_MERGE_STATUS_FIELD] ?? "")).length;
        return <Grid key={key} size={{ xs: 12, md: 6 }}><SectionFrame
          title={label}
          count={rows.length}
          actions={mode === "update" && key !== "sanctions"
            ? <Button disabled={disabled || savingSection !== "" || changedCount === 0} size="small" startIcon={<SaveOutlinedIcon />} variant="contained" onClick={() => setPendingUpdate({ key, label, rows })}>{label} 업데이트</Button>
            : mode === "update" ? <Typography color="text.secondary" variant="caption">검토 전용</Typography> : undefined}
        ><ExtractionGrid
          onDeleteRow={mode === "update" ? (rowNumber) => setSectionEdits((current) => ({ ...current, [key]: discardMergedExtractionRow(rows, rowNumber) })) : undefined}
          onRowsChange={(nextRows) => setSectionEdits((current) => ({ ...current, [key]: nextRows }))}
          sectionKey={key}
          rows={rows}
          valueLabel={key === "licenses"
            ? { field: "license_code", labels: certificationNameByCode }
            : key === "education" ? { field: "career", labels: degreeNameByCode } : undefined}
        /></SectionFrame></Grid>;
      })}
    </Grid>
    {mode === "new" ? <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mt: 1 }}>
      <FormControlLabel control={<Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />} label="기술인 pdf와 기초정보 추출 결과를 직접 확인했습니다." />
      <Button disabled={disabled || !confirmed || hasReferenceMismatch || !displayBasic.name || !displayBasic.birthDate} variant="contained" startIcon={<CheckCircleOutlineOutlinedIcon />} onClick={() => void register()}>기술인 인사정보 등록</Button>
    </Box> : null}
    <Dialog open={Boolean(pendingUpdate)} onClose={() => setPendingUpdate(null)} maxWidth="xs" fullWidth>
      <DialogTitle>{pendingUpdate?.label} 업데이트</DialogTitle>
      <DialogContent>{pendingUpdate?.key === "basic" ? "검토한 기본정보를 DB에 반영하시겠습니까?" : `${pendingUpdate?.label}의 빨간색 업데이트 대상과 노란색 신규 대상을 DB에 반영하시겠습니까?`}</DialogContent>
      <DialogActions>
        <Button onClick={() => setPendingUpdate(null)}>취소</Button>
        <Button variant="contained" onClick={() => {
          const pending = pendingUpdate;
          setPendingUpdate(null);
          if (!pending) return;
          if (pending.key === "basic") void updateBasicInfo();
          else void upsertSection(pending.key, pending.rows ?? []);
        }}>업데이트</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
