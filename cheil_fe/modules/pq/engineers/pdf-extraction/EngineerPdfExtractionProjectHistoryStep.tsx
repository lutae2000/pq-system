"use client";

import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel } from "@mui/material";
import { useMemo, useState } from "react";

import type { RegisteredCompanyPerformance } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionCompanyPerformanceStep";
import { ExtractionGrid, normalizeExtractionSections, SectionFrame } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionReviewShared";
import { discardMergedExtractionRow, PDF_MERGE_STATUS_FIELD } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionMerge";
import type { EngineerPdfExtraction, EngineerPdfExtractionRow } from "@/modules/pq/engineers/pdf-extraction/pdfExtractionApi";

type Props = {
  active: boolean;
  companyPerformances: RegisteredCompanyPerformance[];
  disabled?: boolean;
  engineerId: string;
  mode?: "new" | "update";
  onRegister: (rows: EngineerPdfExtractionRow[]) => Promise<void>;
  result: EngineerPdfExtraction;
};

function normalizeJobName(value: string) {
  return value.normalize("NFKC").replace(/\s+/gu, "").toLocaleLowerCase();
}

export function EngineerPdfExtractionProjectHistoryStep({ active, companyPerformances, disabled = false, engineerId, mode = "new", onRegister, result }: Props) {
  const [rows, setRows] = useState<EngineerPdfExtractionRow[]>(result.sections.projectHistories ?? []);
  const [confirmed, setConfirmed] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const linkedRows = useMemo(() => {
    if (companyPerformances.length === 0) return rows;
    const seqByRowNumber = new Map(companyPerformances.map((item) => [item.companyRowNumber, item.seq]));
    const seqByJobName = new Map(companyPerformances.filter((item) => item.jobName).map((item) => [normalizeJobName(item.jobName ?? ""), item.seq]));
    return rows
      .filter((row) => {
        const companyRowNumber = Number(row.values._company_row_number);
        const jobNameSeq = seqByJobName.get(normalizeJobName(row.values.jobname ?? row.values.job_name ?? ""));
        return !companyRowNumber || seqByRowNumber.has(companyRowNumber) || Boolean(jobNameSeq);
      })
      .map((row) => {
        const companyRowNumber = Number(row.values._company_row_number);
        const companyPerformanceSeq = seqByRowNumber.get(companyRowNumber)
          ?? seqByJobName.get(normalizeJobName(row.values.jobname ?? row.values.job_name ?? ""));
        return companyPerformanceSeq ? { ...row, values: { ...row.values, seq: String(companyPerformanceSeq) } } : row;
      });
  }, [companyPerformances, rows]);
  const uncertainCompanyCount = linkedRows.filter((row) => row.values.compname_uncertain === "Y").length;
  const changedCount = linkedRows.filter((row) => ["insert", "update"].includes(row.values[PDF_MERGE_STATUS_FIELD] ?? "")).length;
  const missingCompanyPerformanceCount = linkedRows.filter((row) => !/^\d+$/.test(row.values.seq ?? "")).length;
  const normalizedRows = () => normalizeExtractionSections({ projectHistories: linkedRows }).projectHistories ?? [];

  if (!active) return null;

  return <Box>
    {mode === "new" && engineerId
      ? <Alert severity="success" sx={{ mb: 1.25 }}>기술인 인사정보 등록이 완료되었습니다. 기술인 ID: {engineerId}</Alert>
      : !engineerId ? <Alert severity="info" sx={{ mb: 1.25 }}>기술경력 추출 결과를 미리 검토할 수 있습니다. 저장은 1단계 기술인 인사정보 등록 후 가능합니다.</Alert> : null}
    {companyPerformances.length === 0 ? <Alert severity="info" sx={{ mb: 1.25 }}>3단계 저장을 위해 2단계 회사 실적 등록을 먼저 완료해 주세요.</Alert> : null}
    {missingCompanyPerformanceCount > 0 ? <Alert severity="warning" sx={{ mb: 1.25 }}>회사 실적과 연결되지 않은 기술경력이 {missingCompanyPerformanceCount}건 있습니다.</Alert> : null}
    {uncertainCompanyCount > 0 ? (
      <Alert severity="warning" sx={{ mb: 1.25 }}>
        보라색 행 {uncertainCompanyCount}건은 기술경력 참여기간과 근무처 재직기간이 정확히 대응되지 않아 확인이 필요합니다. 참여회사를 직접 수정하면 표시가 해제됩니다.
      </Alert>
    ) : null}
    <SectionFrame title="기술경력" count={linkedRows.length}>
      <ExtractionGrid
        allowDeleteAll
        height={500}
        onDeleteRow={(rowNumber) => setRows((current) => mode === "update" ? discardMergedExtractionRow(current, rowNumber) : current.filter((row) => row.rowNumber !== rowNumber))}
        onRowsChange={setRows}
        sectionKey="projectHistories"
        rows={linkedRows}
      />
    </SectionFrame>
    <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mt: 1 }}>
      <FormControlLabel control={<Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />} label="3단계 기술경력 추출 결과를 직접 확인했습니다." />
      <Button disabled={disabled || !engineerId || !confirmed || linkedRows.length === 0 || missingCompanyPerformanceCount > 0 || (mode === "update" && changedCount === 0)} variant="contained" startIcon={<CheckCircleOutlineOutlinedIcon />} onClick={() => setSaveConfirmOpen(true)}>{mode === "update" ? "기술경력 업데이트" : "기술경력 등록"}</Button>
    </Box>
    <Dialog open={saveConfirmOpen} onClose={() => setSaveConfirmOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === "update" ? "기술경력 업데이트" : "기술경력 등록"}</DialogTitle>
      <DialogContent>검토한 기술경력 {linkedRows.length}건을 DB에 반영하시겠습니까?</DialogContent>
      <DialogActions>
        <Button onClick={() => setSaveConfirmOpen(false)}>취소</Button>
        <Button variant="contained" onClick={() => { setSaveConfirmOpen(false); void onRegister(normalizedRows()); }}>{mode === "update" ? "업데이트" : "등록"}</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
