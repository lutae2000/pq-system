"use client";

import { Alert } from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { formatPaddedLevel2CodeLabel, formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { CompanyPerformanceDetailPopup } from "@/modules/pq/company-performance/CompanyPerformanceDetailPopup";
import type { CareerDetailRecord } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { historyGridSx } from "@/modules/pq/engineers/history-tabs/historyTabCommon";

type PerformanceHistoryTabProps = {
  canRead: boolean;
  engineerId: string;
  performanceRefs: CareerDetailRecord[];
};

function formatDate(value: unknown) {
  const normalized = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (normalized.length !== 8) {
    return String(value ?? "");
  }
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
}

export function PerformanceHistoryTab({ canRead, engineerId, performanceRefs }: PerformanceHistoryTabProps) {
  const [detailSeq, setDetailSeq] = useState<number | null>(null);
  const rows = useMemo(() => performanceRefs, [performanceRefs]);

  const jobClassOptionsQuery = useCommonCodeLevel3Options("PQ", "DA", { useYn: "Y" }, { enabled: canRead });
  const technicalGradeOptionsQuery = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: canRead });

  const jobClassLabelByCode = jobClassOptionsQuery.labelByValue;
  const technicalGradeLabelByCode = technicalGradeOptionsQuery.labelByValue;

  const columns = useMemo<GridColDef<CareerDetailRecord>[]>(
    () => [
      { field: "seq", headerName: "이력 ID", minWidth: 80, flex: 1 },
      { field: "jobName", headerName: "이력명", minWidth: 240, flex: 1 },
      {
        field: "startDate",
        headerName: "참여시작",
        width: 110,
        valueFormatter: (value) => formatDate(value),
      },
      {
        field: "endDate",
        headerName: "참여종료",
        width: 110,
        valueFormatter: (value) => formatDate(value),
      },
      {
        field: "jobClass",
        headerName: "참여분야직위",
        width: 120,
        valueFormatter: (value) => formatReferenceLabel(jobClassLabelByCode, value),
      },
      {
        field: "engLevel",
        headerName: "등급",
        width: 80,
        align: "right",
        headerAlign: "right",
        valueFormatter: (value) => formatPaddedLevel2CodeLabel(technicalGradeLabelByCode, value),
      },
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
    ],
    [jobClassLabelByCode, technicalGradeLabelByCode],
  );

  if (!canRead) {
    return <Alert severity="warning">이력 조회 권한이 없습니다.</Alert>;
  }

  if (!engineerId) {
    return <Alert severity="info">기술인를 선택하면 이력을 조회할 수 있습니다.</Alert>;
  }

  if (rows.length === 0) {
    return <Alert severity="info">조회된 이력이 없습니다.</Alert>;
  }

  return (
    <>
      <EnterpriseDataGrid<CareerDetailRecord>
        columns={columns}
        disableVirtualization
        enableCellSelection={false}
        getRowId={(row) => `${row.seq}-${row.id}`}
        hideFooterSelectedRowCount
        onRowDoubleClick={(params: GridRowParams<CareerDetailRecord>) => {
          if (params.row.seq) {
            setDetailSeq(params.row.seq);
          }
        }}
        showPageNumbers
        rows={rows}
        sx={{
          ...historyGridSx,
          "& .MuiDataGrid-row:hover": { cursor: "pointer" },
        }}
      />
      <CompanyPerformanceDetailPopup onClose={() => setDetailSeq(null)} open={Boolean(detailSeq)} seq={detailSeq} />
    </>
  );
}
