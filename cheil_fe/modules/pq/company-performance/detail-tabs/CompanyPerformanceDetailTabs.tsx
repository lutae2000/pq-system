"use client";

import { Alert, Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

import { FileActionCard } from "@/components/common/FileActionCard";
import { useEnterpriseRowActionConfirm } from "@/components/common/EnterpriseDataGrid";
import { ConstructionKindsTab } from "@/modules/pq/company-performance/detail-tabs/ConstructionKindsTab";
import { EngineersTab } from "@/modules/pq/company-performance/detail-tabs/EngineersTab";
import { OutlinesTab } from "@/modules/pq/company-performance/detail-tabs/OutlinesTab";
import type { CompanyPerformanceRecord } from "@/modules/pq/company-performance/api";

type DetailTabsProps = {
  readOnly?: boolean;
  record: CompanyPerformanceRecord;
};

export function CompanyPerformanceDetailTabs({ readOnly = false, record }: DetailTabsProps) {
  const { confirmationDialog, requestConfirmation } = useEnterpriseRowActionConfirm();
  const [activeTab, setActiveTab] = useState(0);
  const attachmentTarget = record.seq
    ? {
        attachmentType: "PERFORMANCE",
        ownerId: record.seq,
        ownerType: "COMPANY_PERFORMANCE",
      }
    : undefined;

  if (!record.seq) {
    return (
      <Box sx={{ mt: 1.5 }}>
        <Alert severity="info" variant="outlined">
          회사 실적을 먼저 저장하면 공사종류, 참여기술인, 공사개요, 첨부파일을 입력할 수 있습니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ alignItems: "start", display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" }, mt: 1.5 }}>
      {confirmationDialog}
      <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, minWidth: 0, overflow: "hidden" }}>
        <Tabs
          onChange={(_event, value) => setActiveTab(value)}
          sx={{
            bgcolor: "#eef4fb",
            borderBottom: "1px solid",
            borderColor: "divider",
            minHeight: 40,
            "& .MuiTab-root": { fontSize: 13, fontWeight: 800, minHeight: 40 },
          }}
          value={activeTab}
        >
          <Tab label="공사종류" />
          <Tab label="참여기술인" />
          <Tab label="공사개요" />
        </Tabs>

        <Box hidden={activeTab !== 0}>{activeTab === 0 ? <ConstructionKindsTab readOnly={readOnly} record={record} requestConfirmation={requestConfirmation} /> : null}</Box>
        <Box hidden={activeTab !== 1}>{activeTab === 1 ? <EngineersTab readOnly={readOnly} record={record} requestConfirmation={requestConfirmation} /> : null}</Box>
        <Box hidden={activeTab !== 2}>{activeTab === 2 ? <OutlinesTab readOnly={readOnly} record={record} requestConfirmation={requestConfirmation} /> : null}</Box>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <FileActionCard
          attachmentTarget={attachmentTarget}
          description={record.seq ? "첨부된 파일이 없습니다." : "회사 실적 저장 후 파일을 업로드할 수 있습니다."}
          multiple
          title="첨부파일"
          uploadDisabled={readOnly || !record.seq}
          uploadLabel="파일 업로드"
        />
      </Box>
    </Box>
  );
}
