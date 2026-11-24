"use client";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { GridColDef, GridEventListener, GridRowSelectionModel } from "@mui/x-data-grid";
import type { SxProps, Theme } from "@mui/material/styles";
import { useCallback, memo } from "react";

import type { SelectedPqEngineer } from "@/modules/pq/pq-participating-engineers/domain/models";

type SelectedEngineerGridProps = {
  columns: GridColDef<SelectedPqEngineer>[];
  height: number;
  onRowClick: GridEventListener<"rowClick">;
  onSelectionChange: (model: GridRowSelectionModel) => void;
  rows: SelectedPqEngineer[];
  selectedEngineerIdSet: ReadonlySet<string>;
  sx?: SxProps<Theme>;
};

const SELECTED_ENGINEER_PAGE_SIZE_OPTIONS = [25, 50, 100];

function SelectedEngineerGridComponent({ columns, height, onRowClick, onSelectionChange, rows, selectedEngineerIdSet, sx }: SelectedEngineerGridProps) {
  const getRowId = useCallback((row: SelectedPqEngineer) => row.engineerId, []);
  const getRowClassName = useCallback(
    ({ row }: { row: SelectedPqEngineer }) => (selectedEngineerIdSet.has(row.engineerId) ? "engineer-row-selected" : ""),
    [selectedEngineerIdSet],
  );

  return (
    <EnterpriseDataGrid<SelectedPqEngineer>
      checkboxSelection
      columns={columns}
      disableRowSelectionOnClick
      enableRowClickCheckboxSelection={false}
      getRowId={getRowId}
      hideFooterSelectedRowCount
      onRowClick={onRowClick}
      onRowSelectionModelChange={onSelectionChange}
      pageSizeOptions={SELECTED_ENGINEER_PAGE_SIZE_OPTIONS}
      paginationMode="client"
      rows={rows}
      rowSelectionModel={{ type: "include", ids: new Set(selectedEngineerIdSet) }}
      getRowClassName={getRowClassName}
      stateCacheKey="pq-participating-engineers:selected-engineers:v2"
      wrapperMinHeight={height}
      sx={{
        ...sx,
        height,
        "& .MuiDataGrid-row.engineer-row-selected": {
          backgroundColor: "rgba(25, 118, 210, 0.10)",
        },
      }}
    />
  );
}

export const SelectedEngineerGrid = memo(SelectedEngineerGridComponent);
