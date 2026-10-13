"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Chip, IconButton, Tooltip, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import { useMemo } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { dateTimeText, formatMoney } from "@/modules/common/formatters";
import type { G2bBidNoticeCandidateRow } from "@/modules/pq/g2b-bid-notice-candidates/domain/models";

type Props = {
  loading: boolean;
  paginationModel: GridPaginationModel;
  rows: G2bBidNoticeCandidateRow[];
  rowCount: number;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onRowDoubleClick: (row: G2bBidNoticeCandidateRow) => void;
  rowSelectionModel: GridRowSelectionModel;
  onRowSelectionModelChange: (model: GridRowSelectionModel) => void;
};

export function G2bBidNoticeCandidateGrid({ loading, paginationModel, rows, rowCount, onPaginationModelChange, onRowDoubleClick, rowSelectionModel, onRowSelectionModelChange }: Props) {
  const columns = useMemo<GridColDef<G2bBidNoticeCandidateRow>[]>(
    () => {
      const baseColumns: GridColDef<G2bBidNoticeCandidateRow>[] = [
      { field: "bidNtceNo", headerName: "입찰공고번호", width: 135 },
      { field: "bidNtceOrd", headerName: "차수", width: 45, align: "center", headerAlign: "center" },
      {
        field: "bidNtceUrl",
        headerName: "나라장터",
        width: 70,
        sortable: false,
        filterable: false,
        renderCell: ({ value }) =>
          value ? (
            <Tooltip title="나라장터 바로가기">
              <IconButton aria-label="나라장터 바로가기" component="a" href={value as string} rel="noreferrer" size="small" target="_blank">
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Typography color="text.disabled" variant="body2">-</Typography>
          ),
      },
      { field: "ntceKindNm", headerName: "공고구분", width: 80 },
      { field: "cntrctCnclsMthdNm", headerName: "계약구분", width: 80 },
      { field: "srvceDivNm", headerName: "용역구분", width: 80 },
      {
        field: "asignBdgtAmt",
        headerName: "설계금액",
        width: 125,
        align: "right",
        headerAlign: "center",
        valueFormatter: (value) => formatMoney(Number(value ?? 0)),
      },
      { field: "bidNtceNm", headerName: "입찰공고명", minWidth: 300, flex: 1.5 },
      { field: "ntceInsttNm", headerName: "공고기관명", width: 220 },
      { field: "dminsttNm", headerName: "수요기관명", width: 220 },
      {
        field: "importedAt",
        headerName: "공고문 반영",
        width: 100,
        sortable: false,
        renderCell: ({ row }) => row.importedAt ? <Chip color="success" label="반영" size="small" /> : <Chip color="default" label="미반영" size="small" variant="outlined" />,
      },
      { field: "befBidBbancNo", headerName: "이전 입찰번호", width: 150 },
      { field: "bidNtceDate", headerName: "입찰공고일시", width: 155, valueFormatter: (value) => dateTimeText(value as string | null) },
      { field: "bidClseDt", headerName: "입찰마감일시", width: 155, valueFormatter: (value) => dateTimeText(value as string | null) },
      { field: "opengDt", headerName: "개찰일시", width: 155, valueFormatter: (value) => dateTimeText(value as string | null) },
      ];
      return baseColumns.map((column) => ({
        ...column,
        align: column.align ?? (column.field === "bidNtceNm" ? "left" : "center"),
        headerAlign: column.headerAlign ?? "center",
      }));
    },
    [],
  );

  return (
    <EnterpriseDataGrid<G2bBidNoticeCandidateRow>
      columns={columns}
      checkboxSelection
      getRowId={(row) => row.id}
      getRowClassName={({ row }) => {
        if (row.ntceKindNm.includes("취소")) return "g2b-cancelled-row";
        if (row.ntceKindNm.includes("변경")) return "g2b-changed-row";
        if (row.befBidBbancNo.trim()) return "g2b-reposted-row";
        return "";
      }}
      keepNonExistentRowsSelected
      loading={loading}
      onPaginationModelChange={onPaginationModelChange}
      onRowDoubleClick={(params) => onRowDoubleClick(params.row)}
      onRowSelectionModelChange={onRowSelectionModelChange}
      paginationMode="server"
      paginationModel={paginationModel}
      pageSizeOptions={[25, 50, 100]}
      rowCount={rowCount}
      rowSelectionModel={rowSelectionModel}
      rows={rows}
      showPageNumbers
      wrapperMinHeight={620}
      sx={{
        height: 620,
        "& .MuiDataGrid-row:hover": { cursor: "pointer" },
        "& .MuiDataGrid-row.g2b-changed-row, & .MuiDataGrid-row.g2b-changed-row > .MuiDataGrid-cell": { backgroundColor: "rgba(33, 150, 243, 0.14) !important" },
        "& .MuiDataGrid-row.g2b-changed-row:hover, & .MuiDataGrid-row.g2b-changed-row:hover > .MuiDataGrid-cell": { backgroundColor: "rgba(33, 150, 243, 0.24) !important" },
        "& .MuiDataGrid-row.g2b-cancelled-row, & .MuiDataGrid-row.g2b-cancelled-row > .MuiDataGrid-cell": { backgroundColor: "rgba(244, 67, 54, 0.14) !important" },
        "& .MuiDataGrid-row.g2b-cancelled-row:hover, & .MuiDataGrid-row.g2b-cancelled-row:hover > .MuiDataGrid-cell": { backgroundColor: "rgba(244, 67, 54, 0.24) !important" },
        "& .MuiDataGrid-row.g2b-reposted-row, & .MuiDataGrid-row.g2b-reposted-row > .MuiDataGrid-cell": { backgroundColor: "rgba(76, 175, 80, 0.14) !important" },
        "& .MuiDataGrid-row.g2b-reposted-row:hover, & .MuiDataGrid-row.g2b-reposted-row:hover > .MuiDataGrid-cell": { backgroundColor: "rgba(76, 175, 80, 0.24) !important" },
      }}
    />
  );
}
