"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { findCompanyPerformanceMatchCandidates, listCompanyPerformances, type CompanyPerformanceMatchCandidate, type CompanyPerformanceRecord } from "@/modules/pq/company-performance/api";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";

const CompanyPerformanceDetailPopup = dynamic(
  () => import("@/modules/pq/company-performance/CompanyPerformanceDetailPopup").then((module) => module.CompanyPerformanceDetailPopup),
  { ssr: false },
);

type Props = {
  initialKeyword: string;
  onClose: () => void;
  onLink: (performance: CompanyPerformanceRecord) => void;
  onUseAsNew: () => void;
  open: boolean;
  similarityThreshold?: number;
};
type SearchResult = CompanyPerformanceRecord & { similarity: number | null };

export function EngineerPdfExtractionCompanyPerformanceLinkDialog({ initialKeyword, onClose, onLink, onUseAsNew, open, similarityThreshold = 0.8 }: Props) {
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPerformance, setSelectedPerformance] = useState<CompanyPerformanceRecord | null>(null);
  const [suggestedPerformance, setSuggestedPerformance] = useState<CompanyPerformanceMatchCandidate | null>(null);
  const [detailSeq, setDetailSeq] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const searchExistingPerformances = useCallback(async (keyword: string) => {
    setSearching(true);
    setSearchError("");
    setSelectedPerformance(null);
    try {
      const [response, matches] = await Promise.all([
        listCompanyPerformances({ businessType: "", clientKind: "", contractFromDate: "", contractToDate: "", jobFinishYn: "All", jobOwnYn: "All", keyword, page: 0, size: 100 }),
        findCompanyPerformanceMatchCandidates([keyword], similarityThreshold),
      ]);
      const candidateBySeq = new Map((matches[0]?.candidates ?? []).map((candidate) => [candidate.seq, candidate]));
      const nextResults = response.content
        .map((record) => ({ ...record, similarity: candidateBySeq.get(record.seq)?.similarity ?? null }))
        .sort((left, right) => (right.similarity ?? -1) - (left.similarity ?? -1));
      setSearchResults(nextResults);
      setSuggestedPerformance(matches[0]?.candidates[0] ?? null);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "기존 회사실적을 검색하지 못했습니다.");
    } finally {
      setSearching(false);
    }
  }, [similarityThreshold]);

  // 검색 다이얼로그를 열 때 사업명으로 후보를 미리 조회합니다.
  useEffect(() => {
    if (open && initialKeyword.trim()) void searchExistingPerformances(initialKeyword);
  }, [initialKeyword, open, searchExistingPerformances]);

  const suggestedRecord = suggestedPerformance ? searchResults.find((record) => record.seq === suggestedPerformance.seq) : null;
  const activePerformance = selectedPerformance ?? suggestedRecord;
  const columns: GridColDef<SearchResult>[] = [
    { field: "jobName", headerName: "사업명", flex: 1, minWidth: 260 },
    { field: "similarity", headerName: "유사도", width: 90, valueFormatter: (value) => typeof value === "number" ? `${Math.round(value * 100)}%` : "-" },
    { field: "orderClient", headerName: "발주처", width: 150 },
    { field: "seq", headerName: "SEQ", width: 80 },
  ];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>기존 회사실적 검색 및 연결</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Box component="form" sx={{ display: "flex", gap: 1 }} onSubmit={(event) => { event.preventDefault(); void searchExistingPerformances(searchKeyword); }}>
              <TextField fullWidth autoFocus label="사업명 검색" size="small" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} />
              <Button disabled={searching} type="submit" variant="outlined">검색</Button>
            </Box>
            {searchError ? <Alert severity="error">{searchError}</Alert> : null}
            {suggestedRecord ? (
              <Alert severity="success" action={<Button color="inherit" size="small" onClick={() => onLink(suggestedRecord)}>바로 연결</Button>}>
                유사도 {Math.round((suggestedPerformance?.similarity ?? 0) * 100)}% 후보를 찾았습니다: {suggestedRecord.jobName} (SEQ {suggestedRecord.seq})
              </Alert>
            ) : null}
            <Typography variant="subtitle2">연결할 기존 용역 {searchResults.length ? <Chip label={`${searchResults.length}건`} size="small" /> : null}</Typography>
            <EnterpriseDataGrid<SearchResult>
              columns={columns}
              getRowId={(row) => row.seq}
              loading={searching}
              onRowClick={(params) => setSelectedPerformance(params.row)}
              onRowSelectionModelChange={(model: GridRowSelectionModel) => {
                const selectedId = Array.from(model.ids)[0];
                setSelectedPerformance(searchResults.find((record) => String(record.seq) === String(selectedId)) ?? null);
              }}
              rowSelectionModel={{ ids: new Set(selectedPerformance ? [selectedPerformance.seq] : []), type: "include" }}
              rows={searchResults}
              checkboxSelection={false}
              disableMultipleRowSelection
              hideFooter
              pageSizeOptions={[100]}
              paginationModel={{ page: 0, pageSize: 100 }}
              rowHeight={32}
              showToolbar={false}
              sx={{ border: 0, height: 440, "& .MuiDataGrid-row:hover": { cursor: "pointer" }, "& .MuiDataGrid-virtualScroller": { overflowY: "auto" } }}
            />
            {activePerformance ? (
              <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
                <Typography color="text.secondary" variant="body2">발주처: {activePerformance.orderClient || "-"} · 용역구분: {activePerformance.jobType || "-"}</Typography>
                <Button size="small" variant="outlined" onClick={() => setDetailSeq(activePerformance.seq)}>상세보기</Button>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="warning" onClick={onUseAsNew}>신규 등록으로 전환</Button>
          <Button onClick={onClose}>취소</Button>
          <Button disabled={!selectedPerformance} variant="contained" onClick={() => selectedPerformance && onLink(selectedPerformance)}>기존 용역 연결</Button>
        </DialogActions>
      </Dialog>
      {detailSeq ? <CompanyPerformanceDetailPopup onClose={() => setDetailSeq(null)} open seq={detailSeq} /> : null}
    </>
  );
}
