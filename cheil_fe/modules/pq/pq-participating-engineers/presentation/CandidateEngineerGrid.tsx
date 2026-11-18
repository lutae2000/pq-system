"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { GridColDef, GridEventListener, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { PqParticipatingEngineerCandidate } from "@/modules/pq/pq-participating-engineers/api";

type CandidateEngineerGridProps = {
  columns: GridColDef<PqParticipatingEngineerCandidate>[];
  loading: boolean;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onRowClick: GridEventListener<"rowClick">;
  onRowDoubleClick: GridEventListener<"rowDoubleClick">;
  onSelectionChange: (model: GridRowSelectionModel) => void;
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
  onSelectionChange,
  paginationModel,
  rowCount,
  rows,
  selectedCandidateIdSet,
  height,
  sx,
}: CandidateEngineerGridProps) {
  return (
    <EnterpriseDataGrid<PqParticipatingEngineerCandidate>
      checkboxSelection
      columns={columns}
      enableRowClickCheckboxSelection={false}
      getRowId={(row) => row.engrId}
      hideFooterSelectedRowCount
      loading={loading}
      onPaginationModelChange={onPaginationModelChange}
      onRowClick={onRowClick}
      onRowDoubleClick={onRowDoubleClick}
      onRowSelectionModelChange={onSelectionChange}
      pageSizeOptions={[25, 50, 100]}
      paginationMode="server"
      paginationModel={paginationModel}
      rowCount={rowCount}
      rows={rows}
      rowSelectionModel={{ type: "include", ids: new Set(selectedCandidateIdSet) }}
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
