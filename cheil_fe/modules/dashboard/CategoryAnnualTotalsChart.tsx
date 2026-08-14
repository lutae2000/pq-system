"use client";

import { Box, Chip, Stack } from "@mui/material";
import type { DashboardCategory, MonthlyCategoryRecord } from "./dashboard.types";

type CategoryAnnualTotalsChartProps = {
  data: MonthlyCategoryRecord[];
  categories: DashboardCategory[];
};

const CHART_WIDTH = 420;
const CHART_HEIGHT = 280;
const PADDING = { top: 18, right: 20, bottom: 18, left: 120 };

const formatValue = new Intl.NumberFormat("ko-KR");

export function CategoryAnnualTotalsChart({ data, categories }: CategoryAnnualTotalsChartProps) {
  const totals = categories.map((category) => ({
    ...category,
    total: data.reduce((sum, item) => sum + item[category.key], 0),
  }));
  const maxTotal = Math.max(...totals.map((item) => item.total), 1);
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const rowHeight = (CHART_HEIGHT - PADDING.top - PADDING.bottom) / totals.length;
  const barHeight = Math.min(rowHeight * 0.48, 18);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Chip size="small" label="Annual total by category" sx={{ bgcolor: "action.hover", fontWeight: 700 }} />
      </Stack>

      <Box sx={{ width: "100%", overflowX: "auto", pb: 1 }}>
        <Box component="svg" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} sx={{ display: "block", minWidth: 360, width: "100%" }}>
          {totals.map((category, index) => {
            const y = PADDING.top + rowHeight * index + rowHeight / 2;
            const barWidth = (category.total / maxTotal) * plotWidth;

            return (
              <g key={category.key}>
                <text x={12} y={y + 4} fill="#0f172a" fontSize="12" fontWeight="700">
                  {category.label}
                </text>
                <rect x={PADDING.left} y={y - barHeight / 2} width={plotWidth} height={barHeight} rx="999" fill="#e5e7eb" />
                <rect x={PADDING.left} y={y - barHeight / 2} width={barWidth} height={barHeight} rx="999" fill={category.color} />
                <text x={PADDING.left + barWidth + 8} y={y + 4} fill="#0f172a" fontSize="12" fontWeight="700">
                  {formatValue.format(category.total)}
                </text>
              </g>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
