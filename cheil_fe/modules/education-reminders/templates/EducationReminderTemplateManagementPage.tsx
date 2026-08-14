"use client";

import { Alert, Box } from "@mui/material";

import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

import { EducationReminderTemplateManagementTab } from "./EducationReminderTemplateManagementTab";

export function EducationReminderTemplateManagementPage() {
  const { canRead } = useCurrentMenuPermission();

  return (
    <Box>
      <PageHeader title="템플릿 관리" />

      {!canRead ? (
        <Alert severity="warning">템플릿 관리 조회 권한이 없습니다.</Alert>
      ) : (
        <EducationReminderTemplateManagementTab />
      )}
    </Box>
  );
}
