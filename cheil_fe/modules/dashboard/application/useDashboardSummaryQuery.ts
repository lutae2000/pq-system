"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardBidNoticeSummary } from "@/modules/dashboard/dashboard.api";
import { dashboardQueryKeys } from "@/modules/dashboard/application/queryKeys";

export function useDashboardSummaryQuery(enabled: boolean, year: number) {
  return useQuery({
    queryKey: dashboardQueryKeys.annualSummary(year),
    queryFn: getDashboardBidNoticeSummary,
    enabled,
  });
}
