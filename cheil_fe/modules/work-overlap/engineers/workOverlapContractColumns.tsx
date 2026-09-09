import { Chip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import type { WorkOverlapEngineerContractRecord } from "@/modules/work-overlap/engineers/api";

const normalizeDate = (value: string | null | undefined) => String(value ?? "").replace(/\D/g, "").slice(0, 8);
const formatDate = (value: string | null | undefined) => {
  const normalized = normalizeDate(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "";
};

export const getWorkOverlapContractStatus = (row: WorkOverlapEngineerContractRecord, referenceDate: string) => {
  const base = normalizeDate(referenceDate);
  const start = normalizeDate(row.constructionStartDate);
  const complete = normalizeDate(row.constructionCompleteDate);
  const stopFrom = normalizeDate(row.constructionStopFromDate);
  const stopTo = normalizeDate(row.constructionStopToDate);
  if (base && complete && base > complete && ((!stopFrom && !stopTo) || (stopFrom && stopTo))) return { color: "success" as const, label: "준공" };
  if (base && start && stopFrom && !stopTo && base > start) return { color: "warning" as const, label: "중지" };
  return { color: "primary" as const, label: "진행" };
};

export const buildWorkOverlapContractColumns = (
  referenceDate: string,
  taskPeriodDays: number,
): GridColDef<WorkOverlapEngineerContractRecord>[] => [
  {
    field: "status",
    headerName: "상태",
    width: 62,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => {
      const status = getWorkOverlapContractStatus(row, referenceDate);
      return <Chip color={status.color} label={status.label} size="small" variant="filled" />;
    },
  },
  { field: "contractNo", headerName: "계약번호", width: 80, align: "center", headerAlign: "center" },
  { field: "serviceType", headerName: "구분", width: 40, valueGetter: (_value, row) => row.serviceType ?? "" },
  {
    field: "publicContractYn",
    headerName: "공개계약",
    width: 70,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => <Chip color={row.publicContractYn ? "success" : "error"} label={row.publicContractYn ? "공개" : "미공개"} size="small" variant={row.publicContractYn ? "filled" : "outlined"} />,
  },
  { field: "serviceName", headerName: "용역명", minWidth: 220, flex: 1.2, renderCell: ({ row }) => <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 700 }}>{row.serviceName}</Typography> },
  { field: "clientName", headerName: "발주처", minWidth: 120, flex: 0.8, valueGetter: (_value, row) => row.clientName ?? "" },
  { field: "contractAmount", headerName: "계약금액", width: 130, align: "right", headerAlign: "center", valueGetter: (_value, row) => row.contractAmount == null ? "" : row.contractAmount.toLocaleString("ko-KR") },
  { field: "shareAmount", headerName: "지분금액", width: 130, align: "right", headerAlign: "center", valueGetter: (_value, row) => row.shareAmount == null ? "" : row.shareAmount.toLocaleString("ko-KR") },
  { field: "constructionStartDate", headerName: "착수일", width: 105, valueGetter: (_value, row) => formatDate(row.constructionStartDate) },
  { field: "constructionCompleteDate", headerName: "준공일", width: 105, valueGetter: (_value, row) => formatDate(row.constructionCompleteDate) },
  { field: "managementServiceCompleteDate", headerName: "관리용역 준공일", width: 113, valueGetter: (_value, row) => formatDate(row.managementServiceCompleteDate) },
  { field: "constructionStopFromDate", headerName: "중지일", width: 105, valueGetter: (_value, row) => formatDate(row.constructionStopFromDate) },
  { field: "constructionStopToDate", headerName: "중지종료일", width: 105, valueGetter: (_value, row) => formatDate(row.constructionStopToDate) },
  { field: "remainDate", headerName: "잔여일", width: 90, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.remainDate ?? "" },
  { field: "recognizedDays", headerName: "인정일수", width: 80, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.remainDate == null ? "" : `${Math.min(Math.max(0, row.remainDate), taskPeriodDays)}일` },
  { field: "participationType", headerName: "참여구분", minWidth: 80, flex: 0.8, valueGetter: (_value, row) => row.participationType || "" },
  {
    field: "pqTargetYn",
    headerName: "PQ대상자 여부",
    width: 110,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => row.pqTargetYn == null ? null : <Chip color={row.pqTargetYn ? "success" : "default"} label={row.pqTargetYn ? "대상" : "미대상"} size="small" variant={row.pqTargetYn ? "filled" : "outlined"} />,
  },
  { field: "remark", headerName: "비고", minWidth: 160, flex: 1, valueGetter: (_value, row) => row.remark || "-" },
];
