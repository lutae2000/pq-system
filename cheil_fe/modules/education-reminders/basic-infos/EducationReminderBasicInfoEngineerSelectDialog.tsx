"use client";

import { EngineerSelectDialog } from "@/components/common/EngineerSelectDialog";

type EducationReminderBasicInfoEngineerSelectDialogProps = {
  assignedEngineerIds: string[];
  educationName: string;
  open: boolean;
  onClose: () => void;
  onSave: (engineerIds: string[]) => void;
};

export function EducationReminderBasicInfoEngineerSelectDialog({
  assignedEngineerIds,
  educationName,
  open,
  onClose,
  onSave,
}: EducationReminderBasicInfoEngineerSelectDialogProps) {
  return (
    <EngineerSelectDialog
      assignedEngineerIds={assignedEngineerIds}
      onClose={onClose}
      onSave={onSave}
      open={open}
      title={educationName}
    />
  );
}
