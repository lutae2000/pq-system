"use client";

import { Box, Chip, Stack } from "@mui/material";
import type { MonthlyAwardAmountRecord } from "./dashboard.types";

type MonthlyAwardAmountChartProps = {
  data: MonthlyAwardAmountRecord[];
};

const CHART_WIDTH = 760;
const CHART_HEIGHT = 260;
const PADDING = { top: 24, right: 24, bottom: 36, left: 48 };

const formatAmount = new Intl.NumberFormat("ko-KR");

export function MonthlyAwardAmountChart({ data }: MonthlyAwardAmountChartProps) {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maxValue = Math.max(...data.map((item) => item.awardAmount), 1);

  const points = data.map((item, index) => {
    const x = PADDING.left + (plotWidth / Math.max(data.length - 1, 1)) * index;
    const y = PADDING.top + plotHeight - (item.awardAmount / maxValue) * plotHeight;
    return { x, y, amount: item.awardAmount, month: item.month };
  });

  const path = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Chip size="small" label="수주액 추이" sx={{ bgcolor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", fontWeight: 700 }} />
      </Stack>

      <Box sx={{ width: "100%", overflowX: "auto", pb: 1 }}>
        <Box component="svg" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} sx={{ display: "block", minWidth: 620, width: "100%" }}>
          {[0, 25, 50, 75, 100].map((ratio) => {
            const value = Math.round(maxValue * (ratio / 100));
            const y = PADDING.top + plotHeight - (ratio / 100) * plotHeight;

            return (
              <g key={ratio}>
                <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 6" />
                <text x={12} y={y + 4} fill="#6b7280" fontSize="12">
                  {formatAmount.format(value)}
                </text>
              </g>
            );
          })}

          <polyline fill="none" points={path} stroke="#2563eb" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((point) => (
            <g key={point.month}>
              <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
              <text x={point.x} y={CHART_HEIGHT - 10} fill="#64748b" fontSize="12" textAnchor="middle">
                {point.month}
              </text>
              <text x={point.x} y={point.y - 8} fill="#0f172a" fontSize="11" fontWeight="700" textAnchor="middle">
                {formatAmount.format(point.amount)}
              </text>
            </g>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
