import { gridNumberComparator, type GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import {
  decimal, departmentOrder, formatChange, submissionStatusHeight, totalRowId, wholeNumber, type SubmissionStatusRow,
} from "./submissionStatusRows";

type BidNoticeSubmissionStatusGridProps = {
  rows: SubmissionStatusRow[];
  years: number[];
  throughMonth: number;
  loading: boolean;
};

export function BidNoticeSubmissionStatusGrid({ rows, years, throughMonth, loading }: BidNoticeSubmissionStatusGridProps) {
  const currentYear = years.at(-1);
  const columns = useMemo(() => ([
    { field: "departmentName", headerName: "부서", minWidth: 155, flex: 1, sortComparator: departmentOrder.compare },
    ...years.slice(0, -1).map<GridColDef<SubmissionStatusRow>>((year, index) => ({
      field: `year-${year}`,
      headerName: `${year}년`,
      type: "number",
      minWidth: 85,
      valueGetter: (_value, row) => row.yearlyCounts[index],
      valueFormatter: (value: number) => value,
      renderCell: ({ value }) => wholeNumber.format(value),
    })),
    {
      field: "average", headerName: "5년 평균", type: "number", width: 98,
      valueFormatter: (value: number) => value,
      renderCell: ({ value }) => decimal.format(value),
    },
    {
      field: "current",
      headerName: `${currentYear}년`,
      type: "number",
      width: 90,
      valueFormatter: (value: number) => value,
      renderCell: ({ value }) => wholeNumber.format(value),
      headerClassName: "submission-current-year",
      cellClassName: "submission-current-year",
    },
    {
      field: "lastYearChange",
      headerName: "전년 대비",
      type: "number",
      width: 138,
      valueGetter: (_value, row) => row.current - row.lastYear,
      valueFormatter: (_value, row) => formatChange(row.current, row.lastYear),
    },
    {
      field: "averageChange",
      headerName: "평균 대비",
      type: "number",
      width: 138,
      valueGetter: (_value, row) => row.current - row.average,
      valueFormatter: (_value, row) => formatChange(row.current, row.average),
    },
  ] satisfies GridColDef<SubmissionStatusRow>[]).map<GridColDef<SubmissionStatusRow>>((column) => ({
    ...column,
    getSortComparator: (direction) => (left, right, leftCell, rightCell) => {
      if (leftCell.id === totalRowId || rightCell.id === totalRowId) {
        return Number(leftCell.id === totalRowId) - Number(rightCell.id === totalRowId);
      }
      const compare = column.sortComparator ?? gridNumberComparator;
      return (direction === "desc" ? -1 : 1) * compare(left, right, leftCell, rightCell);
    },
  })), [currentYear, years]);

  return (
    <EnterpriseDataGrid
      aria-label="부서별 PQ 제출 건수"
      rows={rows}
      columns={columns}
      loading={loading}
      rowSelection={false}
      readOnly
      disableColumnFilter
      disableColumnSelector
      showPrintButton={false}
      showXlsxExportButton={rows.length > 0}
      exportFileNamePrefix={`PQ_제출현황_${currentYear}_${String(throughMonth).padStart(2, "0")}월`}
      wrapperMinHeight={submissionStatusHeight}
      pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 25 } } }}
      getRowClassName={({ id }) => id === totalRowId ? "submission-total" : ""}
      localeText={{ noRowsLabel: "조회된 제출 실적이 없습니다." }}
      sx={{
        "& .submission-current-year": { bgcolor: "action.selected", fontWeight: 800 },
        "& .submission-total": { bgcolor: "action.hover", fontWeight: 800 },
      }}
    />
  );
}
