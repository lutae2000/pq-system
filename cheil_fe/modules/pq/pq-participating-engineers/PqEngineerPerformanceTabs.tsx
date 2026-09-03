"use client";

import dynamic from "next/dynamic";
import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";

const SearchTab = dynamic(() => import("./PqEngineerPerformanceSearchTab").then((module) => module.PqEngineerPerformanceSearchTab), { ssr: false });
const AllTab = dynamic(() => import("./PqEngineerPerformanceAllTab").then((module) => module.PqEngineerPerformanceAllTab), { ssr: false });
const WorkOverlapTab = dynamic(() => import("./PqEngineerWorkOverlapTab").then((module) => module.PqEngineerWorkOverlapTab), { ssr: false });

const PERFORMANCE_TAB_HEADER_HEIGHT = 100;
const WORK_OVERLAP_SUMMARY_HEIGHT = 60;
const WORK_OVERLAP_MIN_GRID_HEIGHT = 260;

type Props = {
  canRead: boolean;
  engineerId: string;
  relatedProjectHistoryConditions: RelatedProjectHistoryCondition[];
  referenceDate: string;
  remainingDays: string;
  taskPeriodUnit: "일" | "개월";
  taskPeriodValue: string;
  cardHeight: number;
  defaultPageSize: number;
};

export function PqEngineerPerformanceTabs({ canRead, engineerId, relatedProjectHistoryConditions, referenceDate, remainingDays, taskPeriodUnit, taskPeriodValue, cardHeight, defaultPageSize }: Props) {
  const [tab, setTab] = useState("search");
  const enabled = useTabQueryEnabled(canRead && Boolean(engineerId));

  return (
    <Box sx={{ display: "grid", gap: 1, minHeight: 0 }}>
      <Tabs value={tab} onChange={(_event, value: string) => setTab(value)} variant="scrollable" allowScrollButtonsMobile>
        <Tab label="조회 실적" value="search" />
        <Tab label="실적 전체" value="all" />
        <Tab label="업무중복도" value="overlap" />
      </Tabs>
      {tab === "search" ? <SearchTab canRead={enabled} defaultPageSize={defaultPageSize} engineerId={engineerId} conditions={relatedProjectHistoryConditions} gridHeight={Math.max(400, cardHeight - PERFORMANCE_TAB_HEADER_HEIGHT)} /> : null}
      {tab === "all" ? <AllTab canRead={enabled} defaultPageSize={defaultPageSize} engineerId={engineerId} gridHeight={Math.max(400, cardHeight - PERFORMANCE_TAB_HEADER_HEIGHT)} /> : null}
      {tab === "overlap" ? <WorkOverlapTab canRead={enabled} engineerId={engineerId} referenceDate={referenceDate} remainingDays={remainingDays} taskPeriodUnit={taskPeriodUnit} taskPeriodValue={taskPeriodValue} gridHeight={Math.max(WORK_OVERLAP_MIN_GRID_HEIGHT, cardHeight - PERFORMANCE_TAB_HEADER_HEIGHT - WORK_OVERLAP_SUMMARY_HEIGHT)} /> : null}
    </Box>
  );
}
