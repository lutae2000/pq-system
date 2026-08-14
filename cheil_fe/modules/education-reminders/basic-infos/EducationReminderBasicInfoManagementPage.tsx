"use client";

import { Alert, Box, Card, CardContent, Tab, Tabs } from "@mui/material";
import { useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

import { EducationReminderTemplateManagementTab } from "../templates/EducationReminderTemplateManagementTab";
import { EducationReminderBasicInfoManagementTab } from "./EducationReminderBasicInfoManagementTab";

type ManagementTab = "basic-info" | "template";

export function EducationReminderBasicInfoManagementPage() {
  const { canRead } = useCurrentMenuPermission();
  const [selectedTab, setSelectedTab] = useState<ManagementTab>("basic-info");

  return (
    <Box>
      <PageHeader title="기초 정보 관리" />

      {!canRead ? (
        <Alert severity="warning">기초 정보 관리 조회 권한이 없습니다.</Alert>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              onChange={(_event, value: ManagementTab) => setSelectedTab(value)}
              sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1.5 }}
              value={selectedTab}
            >
              <Tab label="기초 정보 관리" value="basic-info" />
              <Tab label="템플릿 관리" value="template" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {selectedTab === "basic-info" ? <EducationReminderBasicInfoManagementTab /> : <EducationReminderTemplateManagementTab />}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
