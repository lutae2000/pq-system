"use client";

import dynamic from "next/dynamic";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { Chip, Typography, Box } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { listWorkOverlapEngineerContracts, type WorkOverlapEngineerContractRecord } from "@/modules/work-overlap/engineers/api";

const ContractDetailDialog = dynamic(() => import("@/modules/work-overlap/contracts/WorkOverlapContractDetailDialog").then((module) => module.WorkOverlapContractDetailDialog), { ssr: false });

type Props = { canRead: boolean; engineerId: string; referenceDate: string; remainingDays: string; taskPeriodUnit: "일" | "개월"; taskPeriodValue: string; gridHeight: number };
const today = () => { const value = new Date(); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; };
const formatDate = (value: string | null) => { const text = String(value ?? "").replace(/\D/g, "").slice(0, 8); return text.length === 8 ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : ""; };
const normalizeDate = (value: string | null | undefined) => String(value ?? "").replace(/\D/g, "").slice(0, 8);
const getStatus = (row: WorkOverlapEngineerContractRecord, reference: string) => {
  const base = normalizeDate(reference);
  const start = normalizeDate(row.constructionStartDate);
  const complete = normalizeDate(row.constructionCompleteDate);
  const stopFrom = normalizeDate(row.constructionStopFromDate);
  const stopTo = normalizeDate(row.constructionStopToDate);
  if (base && complete && base > complete && ((!stopFrom && !stopTo) || (stopFrom && stopTo))) return { label: "준공", color: "success" as const };
  if (base && start && stopFrom && !stopTo && base > start) return { label: "중지", color: "warning" as const };
  return { label: "진행", color: "primary" as const };
};

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
  const columns = useMemo<GridColDef<WorkOverlapEngineerContractRecord>[]>(() => [
    { field: "status", headerName: "상태", width: 62, align: "center", headerAlign: "center", renderCell: ({ row }) => { const status = getStatus(row, referenceDate || today()); return <Chip color={status.color} label={status.label} size="small" variant="filled" />; } },
    { field: "contractNo", headerName: "관리번호", width: 80 },
    { field: "serviceType", headerName: "구분", width: 40, valueGetter: (_value, row) => row.serviceType ?? "" },
    { field: "publicContractYn", headerName: "공개계약", width: 100, align: "center", headerAlign: "center", renderCell: ({ row }) => <Chip color={row.publicContractYn ? "success" : "error"} label={row.publicContractYn ? "공개" : "미공개"} size="small" variant={row.publicContractYn ? "filled" : "outlined"} /> },
    { field: "serviceName", headerName: "용역명", minWidth: 220, flex: 1.2, renderCell: ({ row }) => <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.serviceName}</Typography> },
    { field: "clientName", headerName: "발주처", minWidth: 120, flex: 0.8, valueGetter: (_value, row) => row.clientName ?? "" },
    { field: "contractAmount", headerName: "계약금액", width: 130, align: "right", valueGetter: (_value, row) => row.contractAmount == null ? "" : row.contractAmount.toLocaleString("ko-KR") },
    { field: "shareAmount", headerName: "지분금액", width: 130, align: "right", valueGetter: (_value, row) => row.shareAmount == null ? "" : row.shareAmount.toLocaleString("ko-KR") },
    { field: "constructionStartDate", headerName: "착수일", width: 105, valueGetter: (_value, row) => formatDate(row.constructionStartDate) },
    { field: "constructionCompleteDate", headerName: "준공일", width: 105, valueGetter: (_value, row) => formatDate(row.constructionCompleteDate) },
    { field: "managementServiceCompleteDate", headerName: "관리용역 준공일", width: 113, valueGetter: (_value, row) => formatDate(row.managementServiceCompleteDate) },
    { field: "constructionStopFromDate", headerName: "중지일", width: 105, valueGetter: (_value, row) => formatDate(row.constructionStopFromDate) },
    { field: "constructionStopToDate", headerName: "중지종료일", width: 105, valueGetter: (_value, row) => formatDate(row.constructionStopToDate) },
    { field: "remainDate", headerName: "잔여일", width: 90, align: "center" },
    { field: "recognizedDays", headerName: "인정일수", width: 80, align: "center", valueGetter: (_value, row) => row.remainDate == null ? "" : `${Math.min(Math.max(0, row.remainDate), taskPeriodDays)}일` },
    { field: "participationType", headerName: "참여구분", minWidth: 80, flex: 0.8, valueGetter: (_value, row) => row.participationType || "" },
    { field: "pqTargetYn", headerName: "PQ대상자 여부", width: 110, align: "center", renderCell: ({ row }) => row.pqTargetYn == null ? null : <Chip color={row.pqTargetYn ? "success" : "default"} label={row.pqTargetYn ? "대상" : "미대상"} size="small" variant={row.pqTargetYn ? "filled" : "outlined"} /> },
    { field: "remark", headerName: "비고", minWidth: 160, flex: 1, valueGetter: (_value, row) => row.remark || "-" },
  ], [referenceDate, taskPeriodDays]);
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
