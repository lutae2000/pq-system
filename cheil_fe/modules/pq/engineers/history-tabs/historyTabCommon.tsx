"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Box, Button } from "@mui/material";
import type { ReactNode } from "react";

import { FileActionCard, type FileActionCardFileItem } from "@/components/common/FileActionCard";
import type { AttachmentItem, DetailTab } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

type AttachmentPanelProps = {
  attachments: AttachmentItem[];
  onAttachmentUpload: (tab: DetailTab, recordId: string, files: File[]) => void;
  readOnly?: boolean;
  recordId?: string;
  selectedLabel?: string;
  tab: DetailTab;
  title: string;
};

type HistoryTabHeaderProps = {
  disabled: boolean;
  hideCreateButton?: boolean;
  onCreate: () => void;
};

export function TabPanel({
  children,
  readOnly = false,
  value,
  panelValue,
}: {
  children: ReactNode;
  panelValue: DetailTab;
  readOnly?: boolean;
  value: DetailTab;
}) {
  if (value !== panelValue) {
    return null;
  }

  return <Box sx={{ pt: readOnly ? 0 : 2 }}>{children}</Box>;
}

export const historyGridSx = {
  border: 0,
  minHeight: 280,
  "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
};

function mapAttachmentFiles(attachments: AttachmentItem[]): FileActionCardFileItem[] {
  return attachments.map((attachment) => ({
    contentType: attachment.type,
    downloadUrl: attachment.url,
    fileId: attachment.id,
    fileName: attachment.name,
    size: attachment.size,
  }));
}

export function AttachmentPanel({ attachments, onAttachmentUpload, readOnly = false, recordId, selectedLabel, tab, title }: AttachmentPanelProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <FileActionCard
        description={
          selectedLabel
            ? `${selectedLabel} 에 등록된 파일이 없습니다.`
            : "대상을 선택하면 첨부 파일을 업로드할 수 있습니다."
        }
        files={mapAttachmentFiles(attachments)}
        multiple
        onFilesSelected={(files) => recordId && onAttachmentUpload(tab, recordId, files)}
        title={`${title} 파일`}
        uploadDisabled={readOnly || !selectedLabel}
        uploadLabel="파일 업로드"
      />
    </Box>
  );
}

export function HistoryTabHeader({ disabled, hideCreateButton = false, onCreate }: HistoryTabHeaderProps) {
  if (hideCreateButton) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, alignItems: "center", mb: 1.5, flexWrap: "wrap" }}>
      <Button disabled={disabled} onClick={onCreate} startIcon={<AddOutlinedIcon />} variant="outlined">
        추가
      </Button>
    </Box>
  );
}
