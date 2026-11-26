"use client";

import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { DashboardChartCard } from "./DashboardChartCard";
import { DashboardDepartmentSummaryGrid } from "./DashboardDepartmentSummaryGrid";
import { DashboardDepartmentRateChart } from "./DashboardDepartmentRateChart";
import { MonthlyAwardAmountChart } from "./MonthlyAwardAmountChart";
import { MonthlyAwardRateChart } from "./MonthlyAwardRateChart";
import type { MonthlyAwardAmountRecord, MonthlyBidRecord } from "./dashboard.types";
import type { DashboardScheduleEvent } from "./dashboardSchedule.data";
import type { BidNoticeAttachmentState, BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import { useDashboardBidNoticeQuery } from "@/modules/dashboard/application/useDashboardBidNoticeQuery";
import { useDashboardSummaryQuery } from "@/modules/dashboard/application/useDashboardSummaryQuery";
import { useDashboardDepartmentSummaryQuery } from "@/modules/dashboard/application/useDashboardDepartmentSummaryQuery";
import type { DashboardBidNoticeSummary } from "@/modules/dashboard/dashboard.api";
import { useTabActivity } from "@/components/layout/TabActivityContext";

const DashboardScheduleCalendar = dynamic(
  () => import("./DashboardScheduleCalendar").then((module) => module.DashboardScheduleCalendar),
  { ssr: false },
);
const BidNoticeDetailDialog = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeDetailDialog").then((module) => module.BidNoticeDetailDialog),
  { ssr: false },
);

const monthlyBidData: MonthlyBidRecord[] = [
  { month: "1월", submittedBids: 26, awardedBids: 8 },
  { month: "2월", submittedBids: 24, awardedBids: 9 },
  { month: "3월", submittedBids: 29, awardedBids: 13 },
  { month: "4월", submittedBids: 28, awardedBids: 14 },
  { month: "5월", submittedBids: 32, awardedBids: 16 },
  { month: "6월", submittedBids: 31, awardedBids: 17 },
  { month: "7월", submittedBids: 35, awardedBids: 18 },
  { month: "8월", submittedBids: 34, awardedBids: 19 },
  { month: "9월", submittedBids: 33, awardedBids: 18 },
  { month: "10월", submittedBids: 37, awardedBids: 21 },
  { month: "11월", submittedBids: 36, awardedBids: 20 },
  { month: "12월", submittedBids: 40, awardedBids: 24 },
];

const monthlyAwardAmountData: MonthlyAwardAmountRecord[] = monthlyBidData.map((item, index) => ({
  month: item.month,
  awardAmount: [1.4, 1.5, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 2.7, 3.1, 3.0, 3.6][index] * 100000000,
}));

const showSampleCharts = process.env.NEXT_PUBLIC_APP_PROFILE === "local" || process.env.NEXT_PUBLIC_APP_PROFILE === "dev";

const summaryCards = (summary: DashboardBidNoticeSummary | undefined) => {
  const bidCount = summary?.bidCount ?? 0;
  const successCount = summary?.successCount ?? 0;
  const awardRate = bidCount > 0 ? Math.round((successCount / bidCount) * 1000) / 10 : 0;
  return [
  {
    label: "총 입찰 건수",
    value: summary ? bidCount.toLocaleString("ko-KR") : "-",
    note: "연간 누적 입찰 수",
    icon: FactCheckOutlinedIcon,
  },
  {
    label: "낙찰 건수",
    value: summary ? successCount.toLocaleString("ko-KR") : "-",
    note: "연간 누적 낙찰 수",
    icon: HandshakeOutlinedIcon,
  },
  {
    label: "낙찰률",
    value: summary ? `${awardRate.toLocaleString("ko-KR")}%` : "-",
    note: "총 입찰 대비 낙찰 비율",
    icon: TrendingUpOutlinedIcon,
  },
  {
    label: "수주액",
    value: summary ? `${(summary.designAmount / 100000000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억` : "-",
    note: "연간 누적 수주액",
    icon: MonetizationOnOutlinedIcon,
  },
  ];
};

const emptyAttachments = (): BidNoticeAttachmentState => ({
  announcement: [],
  evaluation: [],
  guide: [],
  specification: [],
  submission: [],
});

const emptyBidNoticeRecord = (): BidNoticeRecord => ({
  active: true,
  baseAmount: 0,
  bidDate: "",
  interviewDate: "",
  bidMethod: "",
  bidNo: "",
  bidClosingDate: "",
  bidType: "",
  bidTypeLabel: "",
  bidMethodLabel: "",
  businessField: "",
  fieldOfWorkLabel: "",
  businessScope: "",
  scopeOfWorkLabel: "",
  businessType: "",
  businessTypeLabel: "",
  category: "공고",
  client: "",
  orderClientName: "",
  content: "",
  department: "",
  departmentName: "",
  draftNote: "",
  electronicVendor: "",
  endDate: "",
  estimateAmount: 0,
  designAmt: 0,
  id: "",
  managerConfirmed: false,
  noticeDate: "",
  onSiteMeetingDate: "",
  participationStatus: "",
  finalParticipationStatus: "",
  g2bBidNtceNo: "",
  g2bBidNtceOrd: "",
  pqRegistrationDate: "",
  pqSubmissionDate: "",
  pqDecideEmpno: "",
  projectName: "",
  procurementMethod: "",
  reasonOfAbsenceCode: "",
  orderMethodLabel: "",
  representativeVendor: "",
  bidSubmissionDate: "",
  writerName: "",
  seqNo: 0,
  sortOrder: 0,
  startDate: "",
  tpSubmissionDate: "",
  bidSuccessYn: "",
  bidSuccessYnLabel: "",
  visible: true,
});

const toBidNoticeRecord = (item: BidNoticeApiRecord): BidNoticeRecord => ({
  ...emptyBidNoticeRecord(),
  bidDate: item.bidDate ?? "",
  interviewDate: item.interviewDate ?? "",
  bidMethod: item.bidMethod ?? "",
  g2bBidNtceNo: item.g2bBidNtceNo ?? "",
  g2bBidNtceOrd: item.g2bBidNtceOrd ?? "",
  bidNo: item.bidSeq ? String(item.bidSeq) : "",
  bidClosingDate: item.bidClosingDate ?? "",
  bidType: item.bidType ?? "",
  bidTypeLabel: item.bidTypeLabel ?? item.bidType ?? "",
  bidMethodLabel: item.bidMethodLabel ?? item.bidMethod ?? "",
  businessField: item.fieldOfWorkCode ?? "",
  fieldOfWorkLabel: item.fieldOfWorkLabel ?? item.fieldOfWorkCode ?? "",
  businessScope: item.scopeOfWorkCode ?? "",
  scopeOfWorkLabel: item.scopeOfWorkLabel ?? item.scopeOfWorkCode ?? "",
  businessType: item.businessType ?? "",
  businessTypeLabel: item.businessTypeLabel ?? item.businessType ?? "",
  client: item.orderClient ?? "",
  orderClientName: item.orderClientName ?? item.orderClient ?? "",
  department: item.departmentCode ?? "",
  departmentName: item.departmentName ?? item.departmentCode ?? "",
  draftNote: item.remark ?? "",
  designAmt: Number(item.designAmt ?? 0),
  estimateAmount: Number(item.designAmt ?? 0),
  id: item.bidSeq ? String(item.bidSeq) : "",
  managerConfirmed: item.bidSuccessYn === "Y",
  noticeDate: item.announceDate ?? "",
  onSiteMeetingDate: item.siteBriefingDate ?? "",
  participationStatus: item.participateYnLabel ?? item.participateYn ?? "",
  finalParticipationStatus: item.participateYn ?? "",
  pqRegistrationDate: item.pqRegistDate ?? "",
  pqSubmissionDate: item.pqSubmitDate ?? "",
  pqDecideEmpno: item.pqDecideEmpno ?? "",
  projectName: item.projectName,
  procurementMethod: item.orderMethod ?? "",
  reasonOfAbsenceCode: item.reasonOfAbsenceCode ?? "",
  orderMethodLabel: item.orderMethodLabel ?? item.orderMethod ?? "",
  representativeVendor: item.primeContractor ?? "",
  bidSubmissionDate: item.bidSubmissionDate ?? "",
  writerName: item.superDecideEmpno ?? "",
  seqNo: item.bidSeq ?? 0,
  sortOrder: item.bidSeq ?? 0,
  startDate: item.announceDate ?? "",
  tpSubmissionDate: item.tpSubmitDate ?? "",
  bidSuccessYn: item.bidSuccessYn ?? "",
  bidSuccessYnLabel: item.bidSuccessYnLabel ?? (item.bidSuccessYn === "Y" ? "낙찰" : "미낙찰"),
});

export function DashboardPage() {
  const isTabActive = useTabActivity();
  const summaryYear = new Date().getFullYear();
  const summaryQuery = useDashboardSummaryQuery(isTabActive, summaryYear);
  const departmentSummaryQuery = useDashboardDepartmentSummaryQuery(isTabActive, summaryYear);
  const [selectedSchedule, setSelectedSchedule] = useState<DashboardScheduleEvent | null>(null);
  const detailQuery = useDashboardBidNoticeQuery(isTabActive, selectedSchedule?.bidSeq);

  const selectedRecord = useMemo(
    () => (detailQuery.data ? toBidNoticeRecord(detailQuery.data) : emptyBidNoticeRecord()),
    [detailQuery.data],
  );

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <DashboardChartCard headerGap={-0.3}>
          <DashboardScheduleCalendar
            onScheduleClick={(event) => {
              setSelectedSchedule(event);
            }}
          />
        </DashboardChartCard>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {summaryCards(summaryQuery.data).map((card) => {
          const Icon = card.icon;

          return (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 900 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {card.note}
                      </Typography>
                    </Box>
                    <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 1.5, color: "primary.contrastText", display: "flex", height: 44, justifyContent: "center", width: 44, flexShrink: 0 }}>
                      <Icon />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}

      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <DashboardChartCard title="부서별 낙찰률" subtitle={`${summaryYear}년 참여 입찰 기준 부서별 낙찰 현황`}>
            <DashboardDepartmentSummaryGrid
              loading={departmentSummaryQuery.isLoading || departmentSummaryQuery.isFetching}
              rows={departmentSummaryQuery.data ?? []}
            />
          </DashboardChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <DashboardChartCard title="부서별 낙찰률 비교" subtitle="낙찰 건수/입찰 건수">
            <DashboardDepartmentRateChart
              loading={departmentSummaryQuery.isLoading || departmentSummaryQuery.isFetching}
              rows={departmentSummaryQuery.data ?? []}
            />
          </DashboardChartCard>
        </Grid>
      </Grid>

      {showSampleCharts && <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <DashboardChartCard title="월별 수주액 추이" subtitle="연간 수주액의 월별 변화를 라인 차트로 보여줍니다.">
            <MonthlyAwardAmountChart data={monthlyAwardAmountData} />
          </DashboardChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <DashboardChartCard title="월별 낙찰률 추이" subtitle="입찰 대비 낙찰 비율의 월간 변화를 보여줍니다.">
            <MonthlyAwardRateChart data={monthlyBidData} />
          </DashboardChartCard>
        </Grid>
      </Grid>}

      <BidNoticeDetailDialog
        attachments={emptyAttachments()}
        deleteDisabled
        onAttachmentDeleteRequest={() => {}}
        onAttachmentUpload={() => {}}
        onClose={() => setSelectedSchedule(null)}
        onDeleteRequest={() => {}}
        onFieldChange={() => {}}
        onSave={() => {}}
        open={selectedSchedule !== null}
        record={selectedRecord}
        saveDisabled
      />
    </Box>
  );
}
