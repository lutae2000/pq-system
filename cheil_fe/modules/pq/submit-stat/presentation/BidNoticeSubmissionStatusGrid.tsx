import { Link } from "@mui/material";
import { gridClasses, gridNumberComparator, type GridColDef, type GridColumnGroupingModel, type GridRenderCellParams } from "@mui/x-data-grid";
import { useMemo } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import {
  decimal, departmentOrder, formatChange, submissionStatusHeight, totalRowId, wholeNumber,
  type SubmissionDetailSelection, type SubmissionStatusRow,
} from "./submissionStatusRows";

type BidNoticeSubmissionStatusGridProps = {
  rows: SubmissionStatusRow[];
  years: number[];
  throughMonth: number;
  loading: boolean;
  onOpenDetails: (selection: SubmissionDetailSelection) => void;
};

export function BidNoticeSubmissionStatusGrid({ rows, years, throughMonth, loading, onOpenDetails }: BidNoticeSubmissionStatusGridProps) {
  const currentYear = years[years.length - 1];
  const cumulativePeriod = throughMonth === 1 ? "1월" : `1~${throughMonth}월`;
  const columnGroupingModel = useMemo<GridColumnGroupingModel>(() => [
    {
      groupId: "monthly",
      headerName: "동월 대비",
      headerAlign: "center",
      headerClassName: "submission-monthly-header submission-group-end",
      children: years.map((year) => ({ field: `monthly-${year}` })),
    },
    {
      groupId: "cumulative",
      headerName: "연도별 누계",
      headerAlign: "center",
      headerClassName: "submission-cumulative-header",
      children: [
        ...years.map((year) => ({ field: `cumulative-${year}` })),
        { field: "average" },
        { field: "lastYearChange" },
        { field: "averageChange" },
      ],
    },
  ], [years]);
  const columns = useMemo(() => {
    const renderDetailNumber = (
      { row, hasFocus, colDef }: GridRenderCellParams<SubmissionStatusRow>,
      displayValue: string,
      hasSubmissions: boolean,
      year: number,
      fromMonth = 1,
    ) => hasSubmissions ? (
      <Link
        component="button"
        type="button"
        underline="none"
        tabIndex={hasFocus ? 0 : -1}
        aria-label={`${row.departmentName} ${colDef.headerName} ${displayValue} 상세 보기`}
        aria-haspopup="dialog"
        sx={{ font: "inherit", cursor: "pointer", fontVariantNumeric: "tabular-nums" }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onOpenDetails({
            filters: {
              firstYear: year, lastYear: year, fromMonth, throughMonth,
              departmentCode: row.departmentCode,
              allDepartments: row.id === totalRowId,
            },
            departmentName: row.departmentName,
            columnLabel: colDef.headerName ?? colDef.field,
            displayValue,
          });
        }}
      >
        {displayValue}
      </Link>
    ) : displayValue;
    const definitions: GridColDef<SubmissionStatusRow>[] = [
      { field: "departmentName", headerName: "부서", minWidth: 155, flex: 1, sortComparator: departmentOrder.compare },
      ...years.map<GridColDef<SubmissionStatusRow>>((year, index) => ({
        field: `monthly-${year}`,
        headerName: `${year}년 ${throughMonth}월`,
        type: "number",
        width: 110,
        valueGetter: (_value, row) => row.monthlyCounts[index],
        valueFormatter: (value: number) => value,
        renderCell: (params: GridRenderCellParams<SubmissionStatusRow, number>) => renderDetailNumber(
          params, wholeNumber.format(params.value ?? 0), Boolean(params.value), year, throughMonth,
        ),
        headerClassName: year === currentYear ? "submission-current-year submission-group-end" : undefined,
        cellClassName: year === currentYear ? "submission-current-year submission-group-end" : undefined,
      })),
      ...years.map<GridColDef<SubmissionStatusRow>>((year, index) => ({
        field: `cumulative-${year}`,
        headerName: `${year}년 ${cumulativePeriod}`,
        type: "number",
        width: 120,
        valueGetter: (_value, row) => row.cumulativeCounts[index],
        valueFormatter: (value: number) => value,
        renderCell: (params: GridRenderCellParams<SubmissionStatusRow, number>) => renderDetailNumber(
          params, wholeNumber.format(params.value ?? 0), Boolean(params.value), year,
        ),
        headerClassName: year === currentYear ? "submission-current-year" : undefined,
        cellClassName: year === currentYear ? "submission-current-year" : undefined,
      })),
      {
        field: "average", headerName: "5년 평균", type: "number", width: 98,
        description: `이전 5년의 ${cumulativePeriod} 누계 평균`,
        valueFormatter: (value: number) => value,
        renderCell: ({ row }) => decimal.format(row.average),
      },
      {
        field: "lastYearChange",
        headerName: "전년 대비",
        description: `전년과 기준연도의 ${cumulativePeriod} 누계 비교`,
        type: "number",
        width: 138,
        valueGetter: (_value, row) => row.current - row.lastYear,
        valueFormatter: (_value, row) => formatChange(row.current, row.lastYear),
      },
      {
        field: "averageChange",
        headerName: "평균 대비",
        description: `이전 5년 평균과 기준연도의 ${cumulativePeriod} 누계 비교`,
        type: "number",
        width: 138,
        valueGetter: (_value, row) => row.current - row.average,
        valueFormatter: (_value, row) => formatChange(row.current, row.average),
      },
    ];
    return definitions.map<GridColDef<SubmissionStatusRow>>((column) => ({
      ...column,
      getSortComparator: (direction) => (left, right, leftCell, rightCell) => {
        if (leftCell.id === totalRowId || rightCell.id === totalRowId) {
          return Number(leftCell.id === totalRowId) - Number(rightCell.id === totalRowId);
        }
        const compare = column.sortComparator ?? gridNumberComparator;
        return (direction === "desc" ? -1 : 1) * compare(left, right, leftCell, rightCell);
      },
    }));
  }, [cumulativePeriod, currentYear, onOpenDetails, throughMonth, years]);

  return (
    <EnterpriseDataGrid
      aria-label="부서별 PQ 제출 건수"
      rows={rows}
      columns={columns}
      columnGroupingModel={columnGroupingModel}
      columnGroupHeaderHeight={34}
      loading={loading}
      rowSelection={false}
      readOnly
      disableColumnFilter
      disableColumnSelector
      showPrintButton={false}
      showXlsxExportButton={rows.length > 0}
      exportFileNamePrefix={`PQ_제출현황_${currentYear}_${String(throughMonth).padStart(2, "0")}월`}
      wrapperMinHeight={submissionStatusHeight}
      pageSizeOptions={[50, 100]}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 50 } } }}
      getRowClassName={({ id }) => id === totalRowId ? "submission-total" : ""}
      localeText={{ noRowsLabel: "조회된 제출 실적이 없습니다." }}
      sx={{
        "& .submission-monthly-header": {
          bgcolor: "#dbeafe",
          [`& .${gridClasses.columnHeaderTitle}`]: { color: "#1e3a8a" },
        },
        "& .submission-cumulative-header": {
          bgcolor: "#ccfbf1",
          [`& .${gridClasses.columnHeaderTitle}`]: { color: "#134e4a" },
        },
        "& .submission-group-end": { borderInlineEnd: "3px solid #64748b" },
        "& .submission-current-year": { bgcolor: "action.selected", fontWeight: 800 },
        "& .submission-total": { bgcolor: "action.hover", fontWeight: 800 },
      }}
    />
  );
}
