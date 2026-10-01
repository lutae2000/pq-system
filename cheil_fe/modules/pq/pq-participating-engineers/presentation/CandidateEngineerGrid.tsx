"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { GridColDef, GridEventListener, GridPaginationModel } from "@mui/x-data-grid";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { PqParticipatingEngineerCandidate } from "@/modules/pq/pq-participating-engineers/api";

type CandidateEngineerGridProps = {
  columns: GridColDef<PqParticipatingEngineerCandidate>[];
  loading: boolean;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onRowClick: GridEventListener<"rowClick">;
  onRowDoubleClick: GridEventListener<"rowDoubleClick">;
  paginationModel: GridPaginationModel;
  rowCount: number;
  rows: PqParticipatingEngineerCandidate[];
  selectedCandidateIdSet: Set<string>;
  height: number;
  sx?: SxProps<Theme>;
};

export function CandidateEngineerGrid({
  columns,
  loading,
  onPaginationModelChange,
  onRowClick,
  onRowDoubleClick,
  paginationModel,
  rowCount,
  rows,
  selectedCandidateIdSet,
  height,
  sx,
}: CandidateEngineerGridProps) {
  return (
    <EnterpriseDataGrid<PqParticipatingEngineerCandidate>
      columns={columns}
      getRowId={(row) => row.engrId}
      hideFooterSelectedRowCount
      loading={loading}
      onPaginationModelChange={onPaginationModelChange}
      onRowClick={onRowClick}
      onRowDoubleClick={onRowDoubleClick}
      pageSizeOptions={[25, 50, 100]}
      paginationMode="server"
      paginationModel={paginationModel}
      rowCount={rowCount}
      rows={rows}
      getRowClassName={({ row }) => (selectedCandidateIdSet.has(row.engrId) ? "candidate-row-selected" : "")}
      wrapperMinHeight={height}
      sx={{
        ...sx,
        height,
        "& .MuiDataGrid-row:hover": { cursor: "pointer" },
        "& .MuiDataGrid-row.candidate-row-selected": {
          backgroundColor: "rgba(25, 118, 210, 0.10)",
        },
      }}
    />
  );
}
