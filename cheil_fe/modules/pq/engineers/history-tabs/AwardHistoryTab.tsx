"use client";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { AwardRecord } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { AttachmentPanel, HistoryTabHeader, historyGridSx } from "@/modules/pq/engineers/history-tabs/historyTabCommon";
import type { AwardHistoryTabProps } from "@/modules/pq/engineers/history-tabs/historyTabTypes";

export function AwardHistoryTab({
  awardGridApiRef,
  awardGridColumns,
  canUpdate,
  createDisabled,
  handleAwardProcessRowUpdate,
  handleRowEditEnterKeyDown,
  handleRowEditStop,
  onAttachmentUpload,
  onOpenAwardCreate,
  onRowModesModelChange,
  onStartRowEdit,
  readOnly = false,
  rowModesModel,
  rows,
  selectedAwardRow,
  setSelectedAwardRowId,
}: AwardHistoryTabProps) {
  return (
    <>
      <HistoryTabHeader
        disabled={createDisabled}
        hideCreateButton={readOnly}
        onCreate={onOpenAwardCreate}
      />
      <EnterpriseDataGrid<AwardRecord>
        apiRef={awardGridApiRef}
        columns={awardGridColumns}
        editMode="row"
        disableVirtualization
        getRowId={(row) => row.id}
        hideFooterSelectedRowCount
        processRowUpdate={handleAwardProcessRowUpdate}
        onRowDoubleClick={(params) => {
          if (!readOnly && canUpdate) {
            onStartRowEdit("award", params.id, "kind");
          }
        }}
        onRowEditStop={handleRowEditStop}
        onRowClick={(params) => setSelectedAwardRowId(params.row.id)}
        rowModesModel={rowModesModel.award}
        onRowModesModelChange={(newModel) => onRowModesModelChange("award", newModel)}
        slotProps={{ root: { onKeyDownCapture: handleRowEditEnterKeyDown("award") } }}
        rows={rows}
        sx={historyGridSx}
      />
      <AttachmentPanel
        attachments={selectedAwardRow?.attachments ?? []}
        onAttachmentUpload={onAttachmentUpload}
        readOnly={readOnly}
        recordId={selectedAwardRow?.id}
        selectedLabel={selectedAwardRow?.kind || selectedAwardRow?.basis}
        tab="award"
        title="상훈/포상"
      />
    </>
  );
}
