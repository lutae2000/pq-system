"use client";

import { Box, Chip, Stack } from "@mui/material";
import type { MonthlyBidRecord } from "./dashboard.types";

type MonthlyAwardRateChartProps = {
  data: MonthlyBidRecord[];
};

const CHART_WIDTH = 760;
const CHART_HEIGHT = 260;
const PADDING = { top: 24, right: 24, bottom: 36, left: 48 };
const formatValue = new Intl.NumberFormat("ko-KR");

export function MonthlyAwardRateChart({ data }: MonthlyAwardRateChartProps) {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const ratePoints = data.map((item) => ({ month: item.month, rate: Math.round((item.awardedBids / item.submittedBids) * 1000) / 10 }));
  const maxValue = Math.max(...ratePoints.map((point) => point.rate), 100);
  const points = ratePoints.map((point, index) => {
    const x = PADDING.left + (plotWidth / Math.max(ratePoints.length - 1, 1)) * index;
    const y = PADDING.top + plotHeight - (point.rate / maxValue) * plotHeight;
    return { ...point, x, y };
  });
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Chip size="small" label="낙찰률 추이" sx={{ bgcolor: "rgba(15, 118, 110, 0.1)", color: "#0f766e", fontWeight: 700 }} />
      </Stack>

      <Box sx={{ width: "100%", overflowX: "auto", pb: 1 }}>
        <Box component="svg" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} sx={{ display: "block", minWidth: 620, width: "100%" }}>
          {[0, 25, 50, 75, 100].map((value) => {
            const y = PADDING.top + plotHeight - (value / 100) * plotHeight;

            return (
              <g key={value}>
                <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 6" />
                <text x={12} y={y + 4} fill="#6b7280" fontSize="12">
                  {formatValue.format(value)}%
                </text>
              </g>
            );
          })}

          <polyline fill="none" points={path} stroke="#0f766e" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((point) => (
            <g key={point.month}>
              <circle cx={point.x} cy={point.y} r="5" fill="#0f766e" stroke="white" strokeWidth="2" />
              <text x={point.x} y={CHART_HEIGHT - 10} fill="#64748b" fontSize="12" textAnchor="middle">
                {point.month}
              </text>
              <text x={point.x} y={point.y - 8} fill="#0f172a" fontSize="11" fontWeight="700" textAnchor="middle">
                {formatValue.format(point.rate)}%
              </text>
            </g>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
