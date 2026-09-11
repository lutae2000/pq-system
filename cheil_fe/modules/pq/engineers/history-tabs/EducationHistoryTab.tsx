"use client";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { EducationRecord } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { AttachmentPanel, HistoryTabHeader, historyGridSx } from "@/modules/pq/engineers/history-tabs/historyTabCommon";
import type { EducationHistoryTabProps } from "@/modules/pq/engineers/history-tabs/historyTabTypes";

export function EducationHistoryTab({
  canUpdate,
  createDisabled,
  educationGridApiRef,
  educationGridColumns,
  handleEducationProcessRowUpdate,
  handleRowEditEnterKeyDown,
  handleRowEditStop,
  onNewRowEditCancel,
  onAttachmentUpload,
  onOpenEducationCreate,
  onRowModesModelChange,
  onStartRowEdit,
  readOnly = false,
  rowModesModel,
  rows,
  selectedEducationRow,
  setSelectedEducationRowId,
}: EducationHistoryTabProps) {
  return (
    <>
      <HistoryTabHeader
        disabled={createDisabled}
        hideCreateButton={readOnly}
        onCreate={onOpenEducationCreate}
      />
      <EnterpriseDataGrid<EducationRecord>
        apiRef={educationGridApiRef}
        columns={educationGridColumns}
        editMode="row"
        disableVirtualization
        getRowId={(row) => row.id}
        isNewRow={(row) => row.id.startsWith("tmp-")}
        hideFooterSelectedRowCount
        processRowUpdate={handleEducationProcessRowUpdate}
        onRowDoubleClick={(params) => {
          if (!readOnly && canUpdate) {
            onStartRowEdit("education", params.id, "schoolName");
          }
        }}
        onRowEditStop={handleRowEditStop}
        onNewRowEditCancel={onNewRowEditCancel}
        onRowClick={(params) => setSelectedEducationRowId(params.row.id)}
        rowModesModel={rowModesModel.education}
        onRowModesModelChange={(newModel) => onRowModesModelChange("education", newModel)}
        slotProps={{ root: { onKeyDownCapture: handleRowEditEnterKeyDown("education") } }}
        rows={rows}
        sx={historyGridSx}
      />
      <AttachmentPanel
        attachments={selectedEducationRow?.attachments ?? []}
        onAttachmentUpload={onAttachmentUpload}
        readOnly={readOnly}
        recordId={selectedEducationRow?.id}
        selectedLabel={selectedEducationRow?.schoolName}
        tab="education"
        title="학력"
      />
    </>
  );
}
