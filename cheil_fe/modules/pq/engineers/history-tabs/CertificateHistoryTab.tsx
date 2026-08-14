"use client";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { CertificateRecord } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { AttachmentPanel, HistoryTabHeader, historyGridSx } from "@/modules/pq/engineers/history-tabs/historyTabCommon";
import type { CertificateHistoryTabProps } from "@/modules/pq/engineers/history-tabs/historyTabTypes";

export function CertificateHistoryTab({
  canUpdate,
  certificateGridApiRef,
  certificateGridColumns,
  createDisabled,
  handleCertificateProcessRowUpdate,
  handleRowEditEnterKeyDown,
  handleRowEditStop,
  onAttachmentUpload,
  onOpenCertificateCreate,
  onRowModesModelChange,
  onStartRowEdit,
  readOnly = false,
  rowModesModel,
  rows,
  selectedCertificateLabel,
  selectedCertificateRow,
  setSelectedCertificateRowId,
}: CertificateHistoryTabProps) {
  return (
    <>
      <HistoryTabHeader
        disabled={createDisabled}
        hideCreateButton={readOnly}
        onCreate={onOpenCertificateCreate}
      />
      <EnterpriseDataGrid<CertificateRecord>
        apiRef={certificateGridApiRef}
        columns={certificateGridColumns}
        editMode="row"
        disableVirtualization
        getRowId={(row) => row.id}
        hideFooterSelectedRowCount
        processRowUpdate={handleCertificateProcessRowUpdate}
        onRowDoubleClick={(params) => {
          if (!readOnly && canUpdate) {
            onStartRowEdit("certificate", params.id, "certificateName");
          }
        }}
        onRowEditStop={handleRowEditStop}
        onRowClick={(params) => setSelectedCertificateRowId(params.row.id)}
        rowModesModel={rowModesModel.certificate}
        onRowModesModelChange={(newModel) => onRowModesModelChange("certificate", newModel)}
        slotProps={{ root: { onKeyDownCapture: handleRowEditEnterKeyDown("certificate") } }}
        rows={rows}
        sx={historyGridSx}
      />
      <AttachmentPanel
        attachments={selectedCertificateRow?.attachments ?? []}
        onAttachmentUpload={onAttachmentUpload}
        readOnly={readOnly}
        recordId={selectedCertificateRow?.id}
        selectedLabel={selectedCertificateLabel ?? selectedCertificateRow?.certificateName}
        tab="certificate"
        title="자격증"
      />
    </>
  );
}
