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
  excludedCompanyPerformanceRowNumbers?: ReadonlySet<number>;
  disabled?: boolean;
  engineerId: string;
  mode?: "new" | "update";
  onRegister: (rows: EngineerPdfExtractionRow[]) => Promise<void>;
  result: EngineerPdfExtraction;
};

function normalizeJobName(value: string) {
  return value.normalize("NFKC").replace(/\s+/gu, "").toLocaleLowerCase();
}

export function EngineerPdfExtractionProjectHistoryStep({ active, companyPerformances, disabled = false, engineerId, excludedCompanyPerformanceRowNumbers, mode = "new", onRegister, result }: Props) {
  const [rows, setRows] = useState<EngineerPdfExtractionRow[]>(result.sections.projectHistories ?? []);
  const [confirmed, setConfirmed] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const linkedRows = useMemo(() => {
    if (companyPerformances.length === 0 && !excludedCompanyPerformanceRowNumbers?.size) {
      return rows;
    }

    if (companyPerformances.length === 0) {
      return rows.filter((row) => {
        const companyRowNumber = Number(row.values._company_row_number);
        return !(companyRowNumber && excludedCompanyPerformanceRowNumbers?.has(companyRowNumber));
      });
    }

    const seqByRowNumber = new Map(companyPerformances.map((item) => [item.companyRowNumber, item.seq]));
    const seqByJobName = new Map(companyPerformances.filter((item) => item.jobName).map((item) => [normalizeJobName(item.jobName ?? ""), item.seq]));
    return rows
      .filter((row) => {
        const companyRowNumber = Number(row.values._company_row_number);
        if (companyRowNumber && excludedCompanyPerformanceRowNumbers?.has(companyRowNumber)) return false;
        const jobName = normalizeJobName(row.values.jobname ?? row.values.job_name ?? "");
        const jobNameSeq = seqByJobName.get(jobName);
        return !companyRowNumber || seqByRowNumber.has(companyRowNumber) || Boolean(jobNameSeq);
      })
      .map((row) => {
        const companyRowNumber = Number(row.values._company_row_number);
        const companyPerformanceSeq = seqByRowNumber.get(companyRowNumber) ?? seqByJobName.get(normalizeJobName(row.values.jobname ?? row.values.job_name ?? ""));
        return companyPerformanceSeq ? { ...row, values: { ...row.values, seq: String(companyPerformanceSeq) } } : row;
      });
  }, [companyPerformances, excludedCompanyPerformanceRowNumbers, rows]);
  const uncertainCompanyCount = linkedRows.filter((row) => row.values.compname_uncertain === "Y").length;
  const changedCount = linkedRows.filter((row) => ["insert", "update"].includes(row.values[PDF_MERGE_STATUS_FIELD] ?? "")).length;
  const missingCompanyPerformanceCount = linkedRows.filter((row) => !/^\d+$/.test(row.values.seq ?? "")).length;
  const normalizedRows = () => normalizeExtractionSections({ projectHistories: linkedRows }).projectHistories ?? [];
  const deleteRows = (rowNumbers: number[]) => {
    const deleted = new Set(rowNumbers);
    setRows((current) => {
      if (mode !== "update") {
        return current.filter((row) => !deleted.has(row.rowNumber));
      }

      return [...deleted]
        .sort((left, right) => right - left)
        .reduce((nextRows, rowNumber) => discardMergedExtractionRow(nextRows, rowNumber), current);
    });
  };

  if (!active) return null;

  return <Box>
    <Alert
      severity={missingCompanyPerformanceCount > 0 || uncertainCompanyCount > 0 ? "warning" : "info"}
      sx={{ mb: 1.25 }}
    >
      <Box sx={{ fontWeight: 700, mb: 0.5 }}>3단계 기술경력 안내</Box>
      <Box component="ul" sx={{ m: 0, pl: 2.5, "& > li + li": { mt: 0.5 } }}>
      {mode === "new" && engineerId
        ? <Box component="li">기술인 인사정보 등록이 완료되었습니다. 기술인 ID: {engineerId}</Box>
        : !engineerId ? <Box component="li">기술경력 추출 결과를 미리 검토할 수 있습니다. 저장은 1단계 기술인 인사정보 등록 후 가능합니다.</Box> : null}
      {companyPerformances.length === 0 ? <Box component="li">3단계 저장을 위해 2단계 회사 실적 등록을 먼저 완료해 주세요.</Box> : null}
      {missingCompanyPerformanceCount > 0 ? <Box component="li">회사 실적과 연결되지 않은 기술경력이 {missingCompanyPerformanceCount}건 있습니다.</Box> : null}
      {uncertainCompanyCount > 0 ? (
        <Box component="li">
          보라색 행 {uncertainCompanyCount}건은 기술경력 참여기간과 근무처 재직기간이 정확히 대응되지 않아 확인이 필요합니다. 참여회사를 직접 수정하면 표시가 해제됩니다.
        </Box>
      ) : null}
      <Box component="li">
        입력하지 않을 행은 체크박스로 여러 건을 선택한 후 Delete 키를 누르면 일괄 삭제할 수 있습니다.
      </Box>
      </Box>
    </Alert>
    <SectionFrame title="기술경력" count={linkedRows.length}>
      <ExtractionGrid
        allowDeleteAll
        height={500}
        onDeleteRow={(rowNumber) => deleteRows([rowNumber])}
        onDeleteRows={deleteRows}
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
