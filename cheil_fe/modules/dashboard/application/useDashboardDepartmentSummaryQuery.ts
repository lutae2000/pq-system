"use client";

import { useQuery } from "@tanstack/react-query";

import { listDashboardDepartmentSummaries } from "@/modules/dashboard/dashboard.api";
import { dashboardQueryKeys } from "@/modules/dashboard/application/queryKeys";

export function useDashboardDepartmentSummaryQuery(enabled: boolean, year: number) {
  return useQuery({
    queryKey: dashboardQueryKeys.departmentSummary(year),
    queryFn: listDashboardDepartmentSummaries,
    enabled,
  });
}
