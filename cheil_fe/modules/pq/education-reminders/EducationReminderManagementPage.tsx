"use client";

import { Alert, Box, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { EducationReminderBasicInfoManagementTab } from "@/modules/pq/education-reminders/EducationReminderBasicInfoManagementTab";
import { EducationReminderCompletionManagementTab } from "@/modules/pq/education-reminders/EducationReminderCompletionManagementTab";
import { EducationReminderHistoryManagementTab } from "@/modules/pq/education-reminders/EducationReminderHistoryManagementTab";
import { EducationReminderTargetManagementTab } from "@/modules/pq/education-reminders/EducationReminderTargetManagementTab";
import { EducationReminderTemplateManagementTab } from "@/modules/pq/education-reminders/EducationReminderTemplateManagementTab";
import {
  initialHistoryRows,
  initialTemplates,
  type MessageTemplate,
  type SendHistoryRow,
} from "@/modules/pq/education-reminders/educationReminderTypes";

const TAB_ITEMS = [
  { label: "발송 대상 관리", value: 0 },
  { label: "발송 이력 관리", value: 1 },
  { label: "이수 여부 관리", value: 2 },
  { label: "기초정보 관리", value: 3 },
  { label: "템플릿 관리", value: 4 },
];

export function EducationReminderManagementPage() {
  const { canRead } = useCurrentMenuPermission();
  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);
  const [historyRows, setHistoryRows] = useState<SendHistoryRow[]>(initialHistoryRows);

  return (
    <Box>
      <PageHeader title=" 교육 알림 관리" />

      {!canRead ? (
        <Alert severity="warning"> 교육 알림 관리 조회 권한이 없습니다.</Alert>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography color="text.secondary" variant="body2">
            발송 대상을 선정한 뒤 실시간 발송을 수행하고, 발송 이력과 이수 여부는 별도 탭에서 관리합니다.
          </Typography>

          <Tabs onChange={(_event, value) => setTab(value)} value={tab}>
            {TAB_ITEMS.map((item) => (
              <Tab key={item.value} label={item.label} value={item.value} />
            ))}
          </Tabs>

          {tab === 0 ? (
            <EducationReminderTargetManagementTab historyRows={historyRows} onHistoryRowsChange={setHistoryRows} templates={templates} />
          ) : null}
          {tab === 1 ? <EducationReminderHistoryManagementTab historyRows={historyRows} /> : null}
          {tab === 2 ? <EducationReminderCompletionManagementTab /> : null}
          {tab === 3 ? <EducationReminderBasicInfoManagementTab /> : null}
          {tab === 4 ? <EducationReminderTemplateManagementTab onTemplatesChange={setTemplates} templates={templates} /> : null}
        </Box>
      )}
    </Box>
  );
}
