"use client";

import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { Box, Card, CardContent, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { DashboardChartCard } from "./DashboardChartCard";
import { MonthlyAwardAmountChart } from "./MonthlyAwardAmountChart";
import { MonthlyAwardRateChart } from "./MonthlyAwardRateChart";
import { MonthlyCategoryStackedChart } from "./MonthlyCategoryStackedChart";
import type { CategoryMonthlySeries, DashboardCategory, MonthlyAwardAmountRecord, MonthlyBidRecord } from "./dashboard.types";
import type { DashboardScheduleEvent } from "./dashboardSchedule.data";
import type { BidNoticeAttachmentState, BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";
import { getBidNotice, type BidNoticeDetailOptions, type BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import { useCommonCodeLevel2Options, useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import { useTabActivity } from "@/components/layout/TabActivityContext";

const DashboardScheduleCalendar = dynamic(
  () => import("./DashboardScheduleCalendar").then((module) => module.DashboardScheduleCalendar),
  { ssr: false },
);
const BidNoticeDetailDialog = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeDetailDialog").then((module) => module.BidNoticeDetailDialog),
  { ssr: false },
);

const categories: DashboardCategory[] = [
  { key: "design", label: "설계", color: "#2563eb" },
  { key: "urbanPlanning", label: "도시계획", color: "#7c3aed" },
  { key: "waterMaintenance", label: "상수도 유지보수", color: "#0f766e" },
  { key: "supervision", label: "감리", color: "#f59e0b" },
];

const categorySeries: CategoryMonthlySeries[] = [
  {
    category: categories[0],
    points: [
      { month: "1월", achievement: 20, plan: 18 },
      { month: "2월", achievement: 21, plan: 19 },
      { month: "3월", achievement: 23, plan: 20 },
      { month: "4월", achievement: 22, plan: 21 },
      { month: "5월", achievement: 24, plan: 22 },
      { month: "6월", achievement: 25, plan: 23 },
      { month: "7월", achievement: 26, plan: 24 },
      { month: "8월", achievement: 27, plan: 25 },
      { month: "9월", achievement: 28, plan: 26 },
      { month: "10월", achievement: 29, plan: 27 },
      { month: "11월", achievement: 30, plan: 28 },
      { month: "12월", achievement: 31, plan: 29 },
    ],
  },
  {
    category: categories[1],
    points: [
      { month: "1월", achievement: 12, plan: 11 },
      { month: "2월", achievement: 13, plan: 12 },
      { month: "3월", achievement: 14, plan: 13 },
      { month: "4월", achievement: 15, plan: 14 },
      { month: "5월", achievement: 16, plan: 15 },
      { month: "6월", achievement: 17, plan: 16 },
      { month: "7월", achievement: 18, plan: 17 },
      { month: "8월", achievement: 19, plan: 18 },
      { month: "9월", achievement: 20, plan: 19 },
      { month: "10월", achievement: 21, plan: 20 },
      { month: "11월", achievement: 22, plan: 21 },
      { month: "12월", achievement: 23, plan: 22 },
    ],
  },
  {
    category: categories[2],
    points: [
      { month: "1월", achievement: 16, plan: 15 },
      { month: "2월", achievement: 17, plan: 16 },
      { month: "3월", achievement: 18, plan: 17 },
      { month: "4월", achievement: 19, plan: 18 },
      { month: "5월", achievement: 20, plan: 19 },
      { month: "6월", achievement: 21, plan: 20 },
      { month: "7월", achievement: 22, plan: 21 },
      { month: "8월", achievement: 23, plan: 22 },
      { month: "9월", achievement: 24, plan: 23 },
      { month: "10월", achievement: 25, plan: 24 },
      { month: "11월", achievement: 26, plan: 25 },
      { month: "12월", achievement: 27, plan: 26 },
    ],
  },
  {
    category: categories[3],
    points: [
      { month: "1월", achievement: 10, plan: 9 },
      { month: "2월", achievement: 11, plan: 10 },
      { month: "3월", achievement: 12, plan: 11 },
      { month: "4월", achievement: 13, plan: 12 },
      { month: "5월", achievement: 14, plan: 13 },
      { month: "6월", achievement: 15, plan: 14 },
      { month: "7월", achievement: 16, plan: 15 },
      { month: "8월", achievement: 17, plan: 16 },
      { month: "9월", achievement: 18, plan: 17 },
      { month: "10월", achievement: 19, plan: 18 },
      { month: "11월", achievement: 20, plan: 19 },
      { month: "12월", achievement: 21, plan: 20 },
    ],
  },
];

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

const totalBids = monthlyBidData.reduce((sum, item) => sum + item.submittedBids, 0);
const awardedBids = monthlyBidData.reduce((sum, item) => sum + item.awardedBids, 0);
const awardRate = Math.round((awardedBids / totalBids) * 1000) / 10;
const totalAwardAmount = monthlyAwardAmountData.reduce((sum, item) => sum + item.awardAmount, 0);
const averageAwardAmount = totalAwardAmount / awardedBids;

const summaryCards = [
  {
    label: "총 입찰 건수",
    value: totalBids.toLocaleString("ko-KR"),
    note: "연간 누적 입찰 수",
    icon: FactCheckOutlinedIcon,
  },
  {
    label: "낙찰 건수",
    value: awardedBids.toLocaleString("ko-KR"),
    note: "연간 누적 낙찰 수",
    icon: HandshakeOutlinedIcon,
  },
  {
    label: "낙찰률",
    value: `${awardRate.toLocaleString("ko-KR")}%`,
    note: "총 입찰 대비 낙찰 비율",
    icon: TrendingUpOutlinedIcon,
  },
  {
    label: "수주액",
    value: `${(totalAwardAmount / 100000000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`,
    note: "연간 누적 수주액",
    icon: MonetizationOnOutlinedIcon,
  },
];

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
  bidStyle: "",
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
  pqRegistrationDate: "",
  pqSubmissionDate: "",
  pqDecideEmpno: "",
  projectName: "",
  procurementMethod: "",
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
  bidStyle: item.processTag ?? "",
  bidMethod: item.bidMethod ?? "",
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
  const [selectedSchedule, setSelectedSchedule] = useState<DashboardScheduleEvent | null>(null);
  const bidMethodOptions = useCommonCodeLevel2Options("ZA", { useYn: "Y" }, { enabled: isTabActive });
  const businessFieldOptions = useCommonCodeLevel2Options("DA", { useYn: "Y" }, { enabled: isTabActive });
  const orderMethodOptions = useCommonCodeLevel2Options("FA", { useYn: "Y" }, { enabled: isTabActive }, "level2Code");
  const bidTypeOptions = useCommonCodeLevel2Options("MB", { useYn: "Y" }, { enabled: isTabActive });
  const businessTypeOptions = useCommonCodeLevel2Options("CA", { useYn: "Y" }, { enabled: isTabActive });
  const businessScopeOptions = useCommonCodeLevel2Options("T2", { useYn: "Y" }, { enabled: isTabActive });
  const finalParticipationOptions = useCommonCodeLevel2Options("YA", { useYn: "Y" }, { enabled: isTabActive });
  const departmentOptions = useDepartmentOptions({ useYn: true }, { enabled: isTabActive });
  const detailOptions = useMemo<BidNoticeDetailOptions>(
    () => ({
      bidMethods: bidMethodOptions.options,
      businessFields: businessFieldOptions.options,
      orderMethods: orderMethodOptions.options,
      bidTypes: bidTypeOptions.options,
      businessTypes: businessTypeOptions.options,
      businessScopes: businessScopeOptions.options,
      finalParticipationStatuses: finalParticipationOptions.options,
      clients: [],
      departments: departmentOptions.options,
    }),
    [
      bidMethodOptions.options,
      businessFieldOptions.options,
      orderMethodOptions.options,
      bidTypeOptions.options,
      businessTypeOptions.options,
      businessScopeOptions.options,
      finalParticipationOptions.options,
      departmentOptions.options,
    ],
  );
  const detailQuery = useQuery({
    queryKey: ["dashboard-bid-notice-detail", selectedSchedule?.bidSeq],
    queryFn: () => getBidNotice(selectedSchedule?.bidSeq ?? 0),
    enabled: isTabActive && Boolean(selectedSchedule?.bidSeq),
  });

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
        {summaryCards.map((card) => {
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

        <Grid size={{ xs: 12, lg: 8 }}>
          <DashboardChartCard
            title="카테고리별 월간 달성률 / 계획률"
            subtitle="월별로 왼쪽은 달성률, 오른쪽은 계획률을 보여주고, 각 막대 안에 카테고리를 스택으로 쌓았습니다."
          >
            <MonthlyCategoryStackedChart series={categorySeries} />
          </DashboardChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                낙찰률 현황
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                총 입찰수와 낙찰수를 비교한 비율입니다.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    낙찰률
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {awardRate.toLocaleString("ko-KR")}%
                  </Typography>
                </Box>
                <LinearProgress
                  value={awardRate}
                  variant="determinate"
                  sx={{ height: 12, borderRadius: 999, mt: 1.5, bgcolor: "grey.200", "& .MuiLinearProgress-bar": { borderRadius: 999, background: "linear-gradient(90deg, #2563eb 0%, #0f766e 100%)" } }}
                />
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      총 입찰
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {totalBids.toLocaleString("ko-KR")}건
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      낙찰
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {awardedBids.toLocaleString("ko-KR")}건
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      미낙찰
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {(totalBids - awardedBids).toLocaleString("ko-KR")}건
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      평균 수주액
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {(averageAwardAmount / 100000000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
      </Grid>

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
        options={detailOptions}
        record={selectedRecord}
        saveDisabled
      />
    </Box>
  );
}
