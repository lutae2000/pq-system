"use client";

import dynamic from "next/dynamic";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { Typography, Box } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { listWorkOverlapEngineerContracts, type WorkOverlapEngineerContractRecord } from "@/modules/work-overlap/engineers/api";
import { buildWorkOverlapContractColumns } from "@/modules/work-overlap/engineers/workOverlapContractColumns";

const ContractDetailDialog = dynamic(() => import("@/modules/work-overlap/contracts/WorkOverlapContractDetailDialog").then((module) => module.WorkOverlapContractDetailDialog), { ssr: false });

type Props = { canRead: boolean; engineerId: string; referenceDate: string; remainingDays: string; taskPeriodUnit: "일" | "개월"; taskPeriodValue: string; gridHeight: number };
const today = () => { const value = new Date(); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; };
export function PqEngineerWorkOverlapTab({ canRead, engineerId, referenceDate, remainingDays, taskPeriodUnit, taskPeriodValue, gridHeight }: Props) {
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [detailRecord, setDetailRecord] = useState<WorkOverlapEngineerContractRecord | null>(null);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [deselectedContractIds, setDeselectedContractIds] = useState<string[]>([]);
  const taskPeriodDays = Math.max(0, Number(taskPeriodValue) * (taskPeriodUnit === "개월" ? 30 : 1));
  const query = useQuery({
    queryKey: ["pq-engineer-work-overlap", engineerId, pagination, referenceDate, remainingDays],
    queryFn: () => listWorkOverlapEngineerContracts(engineerId, { page: pagination.page, size: pagination.pageSize, referenceDate: referenceDate || today(), remainingDays: Number(remainingDays) || 0 }),
    enabled: canRead,
    placeholderData: keepPreviousData,
  });
  const columns = useMemo<GridColDef<WorkOverlapEngineerContractRecord>[]>(() => buildWorkOverlapContractColumns(referenceDate, taskPeriodDays), [referenceDate, taskPeriodDays]);
  const contractRows = query.data?.content ?? [];
  const defaultSelectedIds = contractRows.filter((row) => row.checkYn).map((row) => row.contractNo);
  const resolvedSelectedIds = new Set(
    [...defaultSelectedIds, ...selectedContractIds].filter((contractNo) => !deselectedContractIds.includes(contractNo)),
  );
  const selectedRows = contractRows.filter((row) => resolvedSelectedIds.has(row.contractNo));
  const recognizedDaysTotal = selectedRows.reduce((sum, row) => sum + (row.remainDate == null ? 0 : Math.min(Math.max(0, row.remainDate), taskPeriodDays)), 0);
  const overlapRate = taskPeriodDays > 0 ? (recognizedDaysTotal / taskPeriodDays) * 100 : null;
  const selectionModel: GridRowSelectionModel = { ids: resolvedSelectedIds, type: "include" };
  const handleSelectionChange = (model: GridRowSelectionModel) => {
    const modelIds = new Set(Array.from(model.ids, String));
    const visibleIds = contractRows.map((row) => row.contractNo);
    setSelectedContractIds((current) => Array.from(new Set([...current, ...visibleIds.filter((id) => modelIds.has(id))])).filter((id) => modelIds.has(id) || !visibleIds.includes(id)));
    setDeselectedContractIds((current) => Array.from(new Set([...current, ...visibleIds.filter((id) => !modelIds.has(id))])).filter((id) => !modelIds.has(id) || !visibleIds.includes(id)));
  };
  return (
    <>
      <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: "repeat(3, minmax(0, 1fr))", mb: 1 }}>
        <Box sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, display: "flex", gap: 0.75, justifyContent: "space-between", minWidth: 0, px: 1, py: 0.5 }}><BadgeOutlinedIcon color="primary" fontSize="small" /><Typography color="text.secondary" noWrap variant="caption">선택 건수</Typography><Typography noWrap sx={{ fontWeight: 700, ml: "auto" }} variant="body2">{selectedRows.length}건</Typography></Box>
        <Box sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, display: "flex", gap: 0.75, justifyContent: "space-between", minWidth: 0, px: 1, py: 0.5 }}><WorkOutlineOutlinedIcon color="success" fontSize="small" /><Typography color="text.secondary" noWrap variant="caption">인정일수 합계</Typography><Typography noWrap sx={{ fontWeight: 700, ml: "auto" }} variant="body2">{recognizedDaysTotal.toLocaleString("ko-KR")}일</Typography></Box>
        <Box sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, display: "flex", gap: 0.75, justifyContent: "space-between", minWidth: 0, px: 1, py: 0.5 }}><EngineeringOutlinedIcon color="warning" fontSize="small" /><Typography color="text.secondary" noWrap variant="caption">업무 중복도</Typography><Typography noWrap sx={{ fontWeight: 700, ml: "auto" }} variant="body2">{overlapRate === null ? "-" : `${overlapRate.toFixed(1)}%`}</Typography></Box>
      </Box>
      <EnterpriseDataGrid<WorkOverlapEngineerContractRecord> checkboxSelection columns={columns} getRowId={(row) => row.contractNo} loading={query.isFetching} onPaginationModelChange={setPagination} onRowDoubleClick={(params) => setDetailRecord(params.row)} onRowSelectionModelChange={handleSelectionChange} paginationMode="server" paginationModel={pagination} pageSizeOptions={[25, 50, 100]} rows={contractRows} rowCount={query.data?.totalElements ?? 0} rowSelectionModel={selectionModel} rowHeight={30} showPageNumbers wrapperMinHeight={gridHeight} sx={{ height: gridHeight, minHeight: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }} />
      <ContractDetailDialog key={detailRecord?.contractNo ?? "work-overlap-contract-detail"} deleteDisabled onClose={() => setDetailRecord(null)} onSave={() => undefined} open={Boolean(detailRecord)} record={detailRecord} saveDisabled />
    </>
  );
}
