"use client";

import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useCommonCodeLevel2Options } from "@/modules/common/reference/useReferenceOptions";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { findCompanyPerformanceMatchCandidates, type CompanyPerformanceMatchCandidate, type CompanyPerformanceRecord } from "@/modules/pq/company-performance/api";
import { PDF_MERGE_STATUS_FIELD } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionMerge";
import { EngineerPdfExtractionCompanyPerformanceLinkDialog } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionCompanyPerformanceLinkDialog";
import { ExtractionGrid, SectionFrame } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionReviewShared";
import type { EngineerPdfExtraction, EngineerPdfExtractionRow } from "@/modules/pq/engineers/pdf-extraction/pdfExtractionApi";

export type RegisteredCompanyPerformance = {
  companyRowNumber: number;
  jobName?: string;
  seq: number;
};

type Props = {
  active: boolean;
  disabled?: boolean;
  existingSimilarityThreshold?: number;
  onRegister: (rows: EngineerPdfExtractionRow[]) => Promise<void>;
  result: EngineerPdfExtraction;
};

function normalizeReferenceText(value: string) {
  return value.normalize("NFKC").replace(/[^\p{L}\p{N}]/gu, "").toLocaleLowerCase();
}

function applyExistingPerformance(values: Record<string, string>, performance: CompanyPerformanceMatchCandidate | CompanyPerformanceRecord, manual = false): Record<string, string> {
  const nextValues = Object.fromEntries(Object.entries(values).filter(([field]) => !field.startsWith("_db_")));
  return {
    ...nextValues,
    [PDF_MERGE_STATUS_FIELD]: "existing",
    _existing_seq: String(performance.seq),
    _manual_new: "N",
    _manual_link: manual ? "Y" : "N",
    job_own_yn: "jobOwnYn" in performance ? (performance.jobOwnYn ? "Y" : "N") : "N",
    job_type: "jobType" in performance ? performance.jobType ?? "" : nextValues.job_type ?? "",
    _match_similarity: "similarity" in performance ? String(performance.similarity) : "1",
    match_similarity: "similarity" in performance ? `${Math.round(performance.similarity * 100)}%` : "직접 연결",
  };
}

function markAsNewPerformance(values: Record<string, string>, manuallySelected = false): Record<string, string> {
  const nextValues = Object.fromEntries(Object.entries(values).filter(([field]) => !field.startsWith("_db_")));
  if (!nextValues.job_own_yn?.trim()) nextValues.job_own_yn = "N";
  delete nextValues._existing_seq;
  delete nextValues._match_similarity;
  delete nextValues._manual_link;
  if (nextValues._manual_job_type !== "Y") nextValues.job_type = "";
  return { ...nextValues, [PDF_MERGE_STATUS_FIELD]: "insert", _manual_new: manuallySelected ? "Y" : "N", match_similarity: "-" };
}

export function EngineerPdfExtractionCompanyPerformanceStep({ active, disabled = false, existingSimilarityThreshold = 0.8, onRegister, result }: Props) {
  const [rows, setRows] = useState<EngineerPdfExtractionRow[]>(result.sections.companyPerformances ?? []);
  const [confirmed, setConfirmed] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [linkRowNumber, setLinkRowNumber] = useState<number | null>(null);
  const { showWarning } = useAppSnackbar();
  const similarityThreshold = Math.min(Math.max(existingSimilarityThreshold, 0), 1);
  const serviceTypeReferences = useCommonCodeLevel2Options("ST", { useYn: "Y" }, { enabled: active });
  const businessTypeReferences = useCommonCodeLevel2Options("CA", { useYn: "Y" }, { enabled: active });
  const jobNames = useMemo(() => rows.map((row) => row.values.job_name?.trim() ?? "").filter(Boolean), [rows]);
  const matchQuery = useQuery({
    queryKey: ["pq-engineer-pdf-company-performance-matches", jobNames, similarityThreshold],
    queryFn: () => findCompanyPerformanceMatchCandidates(jobNames, 0),
    enabled: active && jobNames.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  const automaticCandidateByJobName = useMemo(() => new Map(
    (matchQuery.data ?? []).flatMap((match) => match.candidates[0]
      ? [[normalizeReferenceText(match.sourceJobName), match.candidates[0]] as const]
      : []),
  ), [matchQuery.data]);
  const displayRows = useMemo(() => rows.map((row) => {
    const valuesWithDefaults: Record<string, string> = {
      ...row.values,
      construction_type: row.values.construction_type ?? row.values.job_type ?? "",
      job_own_yn: row.values.job_own_yn?.trim() || "N",
      job_type: row.values._manual_link === "Y" || row.values._manual_job_type === "Y" ? row.values.job_type ?? "" : "",
    };
    if (row.values._manual_new === "Y") return { ...row, values: valuesWithDefaults };
    const candidate = automaticCandidateByJobName.get(normalizeReferenceText(valuesWithDefaults.job_name ?? ""));
    if (valuesWithDefaults._manual_link === "Y") return { ...row, values: { ...valuesWithDefaults, [PDF_MERGE_STATUS_FIELD]: "existing" } };
    return {
      ...row,
      values: candidate && candidate.similarity >= similarityThreshold ? applyExistingPerformance(valuesWithDefaults, candidate) : markAsNewPerformance(valuesWithDefaults),
    };
  }), [automaticCandidateByJobName, rows, similarityThreshold]);
  const serviceTypeCodeByText = useMemo(() => new Map(
    serviceTypeReferences.options.flatMap((option) => [
      [normalizeReferenceText(option.value), option.value] as const,
      [normalizeReferenceText(option.label), option.value] as const,
    ]),
  ), [serviceTypeReferences.options]);
  const businessTypeCodeByText = useMemo(() => new Map(
    businessTypeReferences.options.flatMap((option) => [
      [normalizeReferenceText(option.value), option.value] as const,
      [normalizeReferenceText(option.label), option.value] as const,
    ]),
  ), [businessTypeReferences.options]);
  const unresolvedServiceTypeCount = displayRows.filter((row) => {
    const value = row.values.job_type?.trim() ?? "";
    return value && !serviceTypeCodeByText.has(normalizeReferenceText(value));
  }).length;
  const reviewedRows = () => displayRows.map((row) => {
    const extractedType = row.values.job_type?.trim() ?? "";
    const extractedBusinessType = row.values.business_type?.trim() ?? "";
    return {
      ...row,
      values: {
        ...row.values,
        business_type: businessTypeCodeByText.get(normalizeReferenceText(extractedBusinessType)) ?? extractedBusinessType,
        job_type: serviceTypeCodeByText.get(normalizeReferenceText(extractedType)) ?? extractedType,
      },
    };
  });
  const existingCount = displayRows.filter((row) => Boolean(row.values._existing_seq)).length;
  const newCount = displayRows.filter((row) => !row.values._existing_seq).length;
  const unlinkedReviewCount = displayRows.filter((row) => Boolean(row.values._existing_seq) && row.values._manual_link !== "Y").length;

  const openLinkDialog = (rowNumber: number) => {
    setLinkRowNumber(rowNumber);
  };

  const closeLinkDialog = () => {
    setLinkRowNumber(null);
  };

  const linkExistingPerformance = (performance: CompanyPerformanceRecord) => {
    if (linkRowNumber === null) return;
    setRows((current) => current.map((row) => row.rowNumber === linkRowNumber
      ? { ...row, values: applyExistingPerformance(row.values, performance, true) }
      : row));
    closeLinkDialog();
  };

  const useAsNewPerformance = () => {
    if (linkRowNumber === null) return;
    setRows((current) => current.map((row) => row.rowNumber === linkRowNumber
      ? { ...row, values: markAsNewPerformance(row.values, true) }
      : row));
    closeLinkDialog();
  };

  if (!active) return null;

  return <Box>
    <Alert severity="info" sx={{ mb: 1.25 }}>
      사업명 공백 제거 후 유사도가 80% 이상인 용역은 검토 필요로 표시하고 기존 SEQ를 사용합니다. 검색 버튼으로 연결 대상을 직접 변경할 수 있습니다.
    </Alert>
    {matchQuery.isPending ? <Alert severity="info" sx={{ mb: 1.25 }}>기존 회사실적과 사업명 유사도를 비교하고 있습니다.</Alert> : null}
    {matchQuery.isError ? <Alert severity="error" sx={{ mb: 1.25 }}>기존 회사실적 비교에 실패했습니다. 행별 검색으로 기존 용역을 연결해 주세요.</Alert> : null}
    {unresolvedServiceTypeCount > 0 ? <Alert severity="warning" sx={{ mb: 1.25 }}>
      용역구분 공통코드와 정확히 일치하지 않는 값이 {unresolvedServiceTypeCount}건 있습니다. 저장 전에 직접 확인해 주세요.
    </Alert> : null}
    <SectionFrame
      actions={matchQuery.isPending ? <Chip color="info" label="자동 조회 중" size="small" variant="outlined" /> : (
        <>
          <Chip color="warning" label={`검토 필요 ${unlinkedReviewCount}건`} size="small" variant="outlined" />
          <Chip color="success" label={`신규 ${newCount}건`} size="small" variant="outlined" />
        </>
      )}
      title="회사 실적"
      count={displayRows.length}
    >
      <ExtractionGrid
        allowDeleteAll
        height={500}
        onDeleteRow={(rowNumber) => setRows((current) => current.filter((row) => row.rowNumber !== rowNumber))}
        onLinkRow={openLinkDialog}
        onRowsChange={(nextRows) => setRows(nextRows.map((nextRow) => {
          const previousRow = displayRows.find((row) => row.rowNumber === nextRow.rowNumber);
          if (previousRow?.values.job_name === nextRow.values.job_name) return nextRow;
          const values = Object.fromEntries(Object.entries(nextRow.values).filter(([field]) =>
            !field.startsWith("_db_") && !["_existing_seq", "_match_similarity", "_manual_new", "_manual_link", "_manual_job_type"].includes(field)));
          delete values[PDF_MERGE_STATUS_FIELD];
          delete values.match_similarity;
          return { ...nextRow, values };
        }))}
        rows={displayRows}
        sectionKey="companyPerformances"
        valueLabel={{ field: "job_type", labels: new Map(Object.entries(serviceTypeReferences.labelByValue)) }}
        valueLabels={{
          business_type: new Map(Object.entries(businessTypeReferences.labelByValue)),
          job_own_yn: new Map([["N", "타사"], ["Y", "자사"]]),
          job_type: new Map(Object.entries(serviceTypeReferences.labelByValue)),
        }}
      />
    </SectionFrame>
    <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, justifyContent: "space-between", mt: 1 }}>
      <FormControlLabel control={<Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />} label="2단계 회사 실적 추출 결과를 직접 확인했습니다." />
      <Button
        disabled={disabled || matchQuery.isPending || !confirmed || displayRows.length === 0 || displayRows.some((row) => !row.values.job_name?.trim())}
        variant="contained"
        startIcon={<CheckCircleOutlineOutlinedIcon />}
        onClick={() => {
          if (unlinkedReviewCount > 0) {
            showWarning(`검토 필요 상태인 회사실적 ${unlinkedReviewCount}건을 직접 연결한 후 등록해 주세요.`);
            return;
          }
          setSaveConfirmOpen(true);
        }}
      >회사 실적 등록</Button>
    </Box>
    <Dialog open={saveConfirmOpen} onClose={() => setSaveConfirmOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>회사 실적 등록</DialogTitle>
      <DialogContent>신규 회사 실적 {newCount}건을 등록하고 검토 필요 회사 실적 {existingCount}건을 기술경력에 연결하시겠습니까?</DialogContent>
      <DialogActions>
        <Button onClick={() => setSaveConfirmOpen(false)}>취소</Button>
        <Button variant="contained" onClick={() => { setSaveConfirmOpen(false); void onRegister(reviewedRows()); }}>등록</Button>
      </DialogActions>
    </Dialog>
    {linkRowNumber !== null ? <EngineerPdfExtractionCompanyPerformanceLinkDialog
      initialKeyword={displayRows.find((row) => row.rowNumber === linkRowNumber)?.values.job_name ?? ""}
      onClose={closeLinkDialog}
      onLink={linkExistingPerformance}
      onUseAsNew={useAsNewPerformance}
      similarityThreshold={similarityThreshold}
      open
    /> : null}
  </Box>;
}
