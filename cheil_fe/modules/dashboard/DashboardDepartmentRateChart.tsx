"use client";

import { Box, Typography } from "@mui/material";

import type { DashboardDepartmentSummary } from "@/modules/dashboard/dashboard.api";

export function DashboardDepartmentRateChart({ rows, loading }: { rows: DashboardDepartmentSummary[]; loading: boolean }) {
  const sortedRows = [...rows].sort((left, right) => {
    const leftRate = left.bidCount ? left.successCount / left.bidCount : 0;
    const rightRate = right.bidCount ? right.successCount / right.bidCount : 0;
    return rightRate - leftRate || right.bidCount - left.bidCount;
  });

  if (loading && rows.length === 0) {
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>불러오는 중입니다.</Typography>;
  }
  if (sortedRows.length === 0) {
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>표시할 입찰 내역이 없습니다.</Typography>;
  }

  return (
    <Box sx={{ maxHeight: 340, minHeight: 340, overflowY: "auto", pr: 1 }}>
      {sortedRows.map((row) => {
        const rate = row.bidCount > 0 ? Math.round(row.successCount / row.bidCount * 1000) / 10 : 0;
        return (
          <Box key={row.departmentCode ?? "unassigned"} sx={{ mb: 2.25 }}>
            <Box sx={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
              <Typography sx={{ fontWeight: 700, minWidth: 0 }} variant="body2">{row.departmentName}</Typography>
              <Typography sx={{ flexShrink: 0, fontWeight: 700 }} variant="body2">
                {rate.toLocaleString("ko-KR")}% <Typography component="span" color="text.secondary" variant="caption">({row.successCount}/{row.bidCount}건)</Typography>
              </Typography>
            </Box>
            <Box aria-label={`${row.departmentName} 낙찰률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate} role="progressbar" sx={{ bgcolor: "action.hover", borderRadius: 1, height: 12, overflow: "hidden" }}>
              <Box sx={{ bgcolor: "primary.main", borderRadius: 1, height: "100%", width: `${rate}%` }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
