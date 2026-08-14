"use client";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { CareerRecord } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { AttachmentPanel, HistoryTabHeader, historyGridSx } from "@/modules/pq/engineers/history-tabs/historyTabCommon";
import type { CareerHistoryTabProps } from "@/modules/pq/engineers/history-tabs/historyTabTypes";

export function CareerHistoryTab({
  canUpdate,
  careerGridApiRef,
  careerGridColumns,
  createDisabled,
  handleCareerProcessRowUpdate,
  handleRowEditEnterKeyDown,
  handleRowEditStop,
  onAttachmentUpload,
  onOpenCareerCreate,
  onRowModesModelChange,
  onStartRowEdit,
  readOnly = false,
  rowModesModel,
  rows,
  selectedCareerRow,
  setSelectedCareerRowId,
}: CareerHistoryTabProps) {
  return (
    <>
      <HistoryTabHeader disabled={createDisabled} hideCreateButton={readOnly} onCreate={onOpenCareerCreate} />
      <EnterpriseDataGrid<CareerRecord>
        apiRef={careerGridApiRef}
        columns={careerGridColumns}
        editMode="row"
        disableVirtualization
        getRowId={(row) => row.id}
        hideFooterSelectedRowCount
        processRowUpdate={handleCareerProcessRowUpdate}
        onRowDoubleClick={(params) => {
          if (!readOnly && canUpdate) {
            onStartRowEdit("career", params.id, "company");
          }
        }}
        onRowEditStop={handleRowEditStop}
        onRowClick={(params) => setSelectedCareerRowId(params.row.id)}
        rowModesModel={rowModesModel.career}
        onRowModesModelChange={(newModel) => onRowModesModelChange("career", newModel)}
        slotProps={{ root: { onKeyDownCapture: handleRowEditEnterKeyDown("career") } }}
        rows={rows}
        sx={historyGridSx}
      />
      <AttachmentPanel
        attachments={selectedCareerRow?.attachments ?? []}
        onAttachmentUpload={onAttachmentUpload}
        readOnly={readOnly}
        recordId={selectedCareerRow?.id}
        selectedLabel={selectedCareerRow?.company}
        tab="career"
        title="경력"
      />
    </>
  );
}
