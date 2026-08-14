"use client";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { TrainingRecord } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { AttachmentPanel, HistoryTabHeader, historyGridSx } from "@/modules/pq/engineers/history-tabs/historyTabCommon";
import type { TrainingHistoryTabProps } from "@/modules/pq/engineers/history-tabs/historyTabTypes";

export function TrainingHistoryTab({
  canUpdate,
  createDisabled,
  handleRowEditEnterKeyDown,
  handleRowEditStop,
  handleTrainingProcessRowUpdate,
  onAttachmentUpload,
  onOpenTrainingCreate,
  onRowModesModelChange,
  onStartRowEdit,
  readOnly = false,
  rowModesModel,
  rows,
  selectedTrainingRow,
  setSelectedTrainingRowId,
  trainingGridApiRef,
  trainingGridColumns,
}: TrainingHistoryTabProps) {
  return (
    <>
      <HistoryTabHeader
        disabled={createDisabled}
        hideCreateButton={readOnly}
        onCreate={onOpenTrainingCreate}
      />
      <EnterpriseDataGrid<TrainingRecord>
        apiRef={trainingGridApiRef}
        columns={trainingGridColumns}
        editMode="row"
        disableVirtualization
        getRowId={(row) => row.id}
        hideFooterSelectedRowCount
        processRowUpdate={handleTrainingProcessRowUpdate}
        onRowDoubleClick={(params) => {
          if (!readOnly && canUpdate) {
            onStartRowEdit("training", params.id, "trainingName");
          }
        }}
        onRowEditStop={handleRowEditStop}
        onRowClick={(params) => setSelectedTrainingRowId(params.row.id)}
        rowModesModel={rowModesModel.training}
        onRowModesModelChange={(newModel) => onRowModesModelChange("training", newModel)}
        slotProps={{ root: { onKeyDownCapture: handleRowEditEnterKeyDown("training") } }}
        rows={rows}
        sx={historyGridSx}
      />
      <AttachmentPanel
        attachments={selectedTrainingRow?.attachments ?? []}
        onAttachmentUpload={onAttachmentUpload}
        readOnly={readOnly}
        recordId={selectedTrainingRow?.id}
        selectedLabel={selectedTrainingRow?.trainingName}
        tab="training"
        title="교육훈련"
      />
    </>
  );
}
