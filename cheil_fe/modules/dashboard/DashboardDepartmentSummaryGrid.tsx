"use client";

import type { GridColDef } from "@mui/x-data-grid";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { DashboardDepartmentSummary } from "@/modules/dashboard/dashboard.api";

const columns: GridColDef<DashboardDepartmentSummary>[] = [
  { field: "departmentName", headerName: "부서", minWidth: 130, flex: 1, align: "center", headerAlign: "center" },
  { field: "bidCount", headerName: "입찰 건수", width: 105, align: "center", headerAlign: "center" },
  { field: "successCount", headerName: "낙찰 건수", width: 105, align: "center", headerAlign: "center" },
  {
    field: "successRate",
    headerName: "낙찰률",
    width: 95,
    align: "center",
    headerAlign: "center",
    valueGetter: (_value, row) => row.bidCount > 0 ? Math.round(row.successCount / row.bidCount * 1000) / 10 : 0,
    valueFormatter: (value) => `${Number(value).toLocaleString("ko-KR")}%`,
  },
  {
    field: "designAmount",
    headerName: "수주액",
    minWidth: 150,
    flex: 1,
    align: "right",
    headerAlign: "center",
    valueFormatter: (value) => `${Number(value ?? 0).toLocaleString("ko-KR")}원`,
  },
];

export function DashboardDepartmentSummaryGrid({ rows, loading }: { rows: DashboardDepartmentSummary[]; loading: boolean }) {
  return (
    <EnterpriseDataGrid<DashboardDepartmentSummary>
      columns={columns}
      getRowId={(row) => row.departmentCode ?? "unassigned"}
      hideFooterSelectedRowCount
      loading={loading}
      pageSizeOptions={[10, 20, 50]}
      rows={rows}
      showToolbar={false}
      wrapperMinHeight={340}
      sx={{ border: 0 }}
    />
  );
}
