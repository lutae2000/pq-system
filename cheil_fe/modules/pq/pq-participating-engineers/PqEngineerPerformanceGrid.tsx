"use client";

import { Alert, Box, CircularProgress } from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useState } from "react";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { EngineerProjectHistoryReviewRecord } from "@/modules/pq/engineer-performance-docs/api";
import { CompanyPerformanceDetailPopup } from "@/modules/pq/company-performance/CompanyPerformanceDetailPopup";
import { formatPaddedLevel2CodeLabel, formatReferenceLabel } from "@/modules/common/reference/referenceFormat";

type Props = { columns: GridColDef<EngineerProjectHistoryReviewRecord>[]; loading: boolean; rows: EngineerProjectHistoryReviewRecord[]; gridHeight: number };

export function createEngineerHistoryPerformanceColumns(
  jobClassLabelByCode: Record<string, string>,
  technicalGradeLabelByCode: Record<string, string>,
): GridColDef<EngineerProjectHistoryReviewRecord>[] {
  const formatDate = (value: unknown) => {
    const normalized = String(value ?? "").replace(/\D/g, "").slice(0, 8);
    return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : String(value ?? "");
  };
  return [
    { field: "seq", headerName: "이력 ID", minWidth: 80, flex: 1 },
    { field: "jobName", headerName: "이력명", minWidth: 240, flex: 1 },
    { field: "startDate", headerName: "참여시작", width: 110, valueFormatter: (value) => formatDate(value) },
    { field: "endDate", headerName: "참여종료", width: 110, valueFormatter: (value) => formatDate(value) },
    { field: "jobClass", headerName: "참여분야직무", width: 120, valueFormatter: (value) => formatReferenceLabel(jobClassLabelByCode, value) },
    { field: "engLevel", headerName: "등급", width: 80, align: "right", headerAlign: "right", valueFormatter: (value) => formatPaddedLevel2CodeLabel(technicalGradeLabelByCode, value) },
    { field: "compName", headerName: "참여회사", width: 150 },
    { field: "deptName", headerName: "참여부서", width: 130 },
    { field: "grade", headerName: "참여직급", width: 100 },
    { field: "joinYn", headerName: "참여", width: 70, align: "center", headerAlign: "center" },
    { field: "returnYn", headerName: "복귀", width: 70, align: "center", headerAlign: "center" },
    { field: "duty", headerName: "업무", width: 120 },
    { field: "jobPart", headerName: "직무분야", width: 130 },
    { field: "proPart", headerName: "전문분야", width: 130 },
    { field: "method", headerName: "수행방식", width: 110 },
    { field: "remark", headerName: "비고", minWidth: 160, flex: 0.7 },
  ];
}

export function PqEngineerPerformanceGrid({ columns, loading, rows, gridHeight }: Props) {
  const [detailSeq, setDetailSeq] = useState<number | null>(null);
  if (loading && rows.length === 0) return <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>;
  if (!loading && rows.length === 0) return <Alert severity="info">조회된 실적이 없습니다.</Alert>;
  return (
    <>
      <EnterpriseDataGrid<EngineerProjectHistoryReviewRecord>
        columns={columns}
        getRowId={(row) => `${row.sourceSeq}-${row.id}`}
        loading={loading}
        onRowDoubleClick={(params: GridRowParams<EngineerProjectHistoryReviewRecord>) => setDetailSeq(params.row.seq || null)}
        rows={rows}
        showPageNumbers
        wrapperMinHeight={gridHeight}
        rowHeight={30}
        sx={{ height: gridHeight, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
      />
      <CompanyPerformanceDetailPopup onClose={() => setDetailSeq(null)} open={Boolean(detailSeq)} seq={detailSeq} />
    </>
  );
}
