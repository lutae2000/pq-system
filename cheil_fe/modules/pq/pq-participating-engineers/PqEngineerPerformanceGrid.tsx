"use client";

import { Alert, Box, CircularProgress } from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { EngineerProjectHistoryReviewRecord } from "@/modules/pq/engineer-performance-docs/api";
import { CompanyPerformanceDetailPopup } from "@/modules/pq/company-performance/CompanyPerformanceDetailDialog";
import { calculateHistoryParticipationRatios, groupParticipationRows } from "@/modules/pq/company-performance/domain/participationRatio";
import { formatReferenceLabel } from "@/modules/common/reference/referenceFormat";

type Props = {
  jobClassLabelByCode: Record<string, string>;
  loading: boolean;
  rows: readonly EngineerProjectHistoryReviewRecord[];
  participationRows?: readonly EngineerProjectHistoryReviewRecord[];
  gridHeight: number;
};

const rowId = (row: EngineerProjectHistoryReviewRecord) => `${row.sourceSeq}-${row.id}`;
const participationGroupKey = (row: EngineerProjectHistoryReviewRecord) =>
  JSON.stringify([row.engineerId, row.seq ? ["project", row.seq] : ["row", rowId(row)]]);
const historyCellSpanKey = (_value: unknown, row: EngineerProjectHistoryReviewRecord) =>
  row.seq && row.jobName?.trim() ? JSON.stringify([row.engineerId, row.seq, row.jobName]) : rowId(row);

function createEngineerHistoryPerformanceColumns(
  jobClassLabelByCode: Record<string, string>,
  participationRatios: ReadonlyMap<string, number | null>,
): GridColDef<EngineerProjectHistoryReviewRecord>[] {
  const formatDate = (value: unknown) => {
    const normalized = String(value ?? "").replace(/\D/g, "").slice(0, 8);
    return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : String(value ?? "");
  };
  const columns: GridColDef<EngineerProjectHistoryReviewRecord>[] = [
    { field: "seq", headerName: "이력 ID", minWidth: 80, flex: 1, align: "center", headerAlign: "center", rowSpanValueGetter: historyCellSpanKey },
    { field: "jobName", headerName: "이력명", minWidth: 240, flex: 1, align: "center", headerAlign: "center", rowSpanValueGetter: historyCellSpanKey },
    { field: "contractFromDate", headerName: "계약 시작일", width: 110, valueFormatter: (value) => formatDate(value), align: "center", headerAlign: "center" },
    { field: "contractToDate", headerName: "계약 종료일", width: 110, valueFormatter: (value) => formatDate(value), align: "center", headerAlign: "center" },
    { field: "startDate", headerName: "참여시작", width: 110, valueFormatter: (value) => formatDate(value), align: "center", headerAlign: "center" },
    { field: "endDate", headerName: "참여종료", width: 110, valueFormatter: (value) => formatDate(value), align: "center", headerAlign: "center" },
    {
      field: "participationRatio",
      headerName: "참여도",
      type: "number",
      width: 90,
      align: "center",
      headerAlign: "center",
      rowSpanValueGetter: (_value, row) => participationGroupKey(row),
      valueGetter: (_value, row) => participationRatios.get(participationGroupKey(row)) ?? null,
      valueFormatter: (value: number | null) => value?.toFixed(2) ?? "",
    },
    { field: "jobClass", headerName: "참여분야직무", width: 120, valueFormatter: (value) => formatReferenceLabel(jobClassLabelByCode, value), align: "center", headerAlign: "center" },
    { field: "compName", headerName: "참여회사", width: 150, align: "center", headerAlign: "center" },
    { field: "deptName", headerName: "참여부서", width: 130, align: "center", headerAlign: "center" },
    { field: "grade", headerName: "참여직급", width: 100, align: "center", headerAlign: "center" },
    { field: "joinYn", headerName: "참여", width: 70, align: "center", headerAlign: "center" },
    { field: "returnYn", headerName: "복귀", width: 70, align: "center", headerAlign: "center" },
    { field: "duty", headerName: "업무", width: 120, align: "center", headerAlign: "center" },
    { field: "jobPart", headerName: "직무분야", width: 130, align: "center", headerAlign: "center" },
    { field: "proPart", headerName: "전문분야", width: 130, align: "center", headerAlign: "center" },
    { field: "method", headerName: "수행방식", width: 110, align: "center", headerAlign: "center" },
    { field: "remark", headerName: "비고", minWidth: 160, flex: 0.7 },
  ];
  return columns.map((column) => ({
    ...column,
    rowSpanValueGetter: column.rowSpanValueGetter ?? ((_value, row) => rowId(row)),
  }));
}

export function PqEngineerPerformanceGrid({ jobClassLabelByCode, loading, rows, participationRows = rows, gridHeight }: Props) {
  const [detailSeq, setDetailSeq] = useState<number | null>(null);
  const groupedRows = useMemo(() => Array.from(groupParticipationRows(rows, participationGroupKey).values()).flat(), [rows]);
  const participationRatios = useMemo(
    () => calculateHistoryParticipationRatios(groupParticipationRows(participationRows, participationGroupKey)),
    [participationRows],
  );
  const columns = useMemo(
    () => createEngineerHistoryPerformanceColumns(jobClassLabelByCode, participationRatios),
    [jobClassLabelByCode, participationRatios],
  );
  if (loading && rows.length === 0) return <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>;
  if (!loading && rows.length === 0) return <Alert severity="info">조회된 실적이 없습니다.</Alert>;
  return (
    <>
      <EnterpriseDataGrid<EngineerProjectHistoryReviewRecord>
        columns={columns}
        getRowId={rowId}
        loading={loading}
        onRowDoubleClick={(params: GridRowParams<EngineerProjectHistoryReviewRecord>) => setDetailSeq(params.row.seq || null)}
        paginationMode="client"
        pageSizeOptions={[10, 25, 50, 100]}
        rows={groupedRows}
        rowSpanning
        rowCount={rows.length}
        stateCacheKey={false}
        showPageNumbers
        wrapperMinHeight={gridHeight}
        rowHeight={30}
        sx={{ height: gridHeight, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
      />
      <CompanyPerformanceDetailPopup onClose={() => setDetailSeq(null)} open={Boolean(detailSeq)} seq={detailSeq} />
    </>
  );
}
