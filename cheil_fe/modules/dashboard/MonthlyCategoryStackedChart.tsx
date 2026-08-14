"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { CategoryMonthlySeries } from "./dashboard.types";

type MonthlyCategoryStackedChartProps = {
  series: CategoryMonthlySeries[];
};

type TooltipState = {
  month: string;
  category: string;
  metric: "달성률" | "계획률";
  achievement: number;
  plan: number;
  amount: number;
  x: number;
  y: number;
} | null;

const CHART_WIDTH = 760;
const CHART_HEIGHT = 320;
const PADDING = { top: 28, right: 24, bottom: 36, left: 48 };
const MAX_VALUE = 100;

const formatValue = new Intl.NumberFormat("ko-KR");
const formatCurrency = new Intl.NumberFormat("ko-KR");

export function MonthlyCategoryStackedChart({ series }: MonthlyCategoryStackedChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const months = series[0]?.points.map((point) => point.month) ?? [];
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const groupWidth = months.length > 0 ? plotWidth / months.length : plotWidth;
  const barWidth = Math.max(Math.min(groupWidth * 0.26, 18), 7);

  const achievementsByMonth = months.map((_, monthIndex) =>
    series.reduce((sum, categorySeries) => sum + categorySeries.points[monthIndex].achievement, 0),
  );
  const plansByMonth = months.map((_, monthIndex) =>
    series.reduce((sum, categorySeries) => sum + categorySeries.points[monthIndex].plan, 0),
  );
  const maxTotal = Math.max(...achievementsByMonth, ...plansByMonth, 1);

  const legendItems = [
    { label: "달성률", color: "#2563eb" },
    { label: "계획률", color: "#f97316" },
    ...series.map((item) => ({ label: item.category.label, color: item.category.color })),
  ];

  const tooltipStyle = useMemo(() => {
    if (!tooltip) {
      return null;
    }

    const left = Math.min(tooltip.x + 16, window.innerWidth - 260);
    const top = Math.min(tooltip.y + 16, window.innerHeight - 180);
    return { left, top };
  }, [tooltip]);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        {legendItems.map((item) => (
          <Chip
            key={item.label}
            size="small"
            label={item.label}
            sx={{
              bgcolor: `${item.color}1A`,
              color: item.color,
              fontWeight: 700,
            }}
          />
        ))}
      </Stack>

      <Box sx={{ width: "100%", overflowX: "auto", pb: 1 }}>
        <Box component="svg" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} sx={{ display: "block", minWidth: 620, width: "100%" }}>
          {[0, 25, 50, 75, 100].map((value) => {
            const y = PADDING.top + plotHeight - (value / MAX_VALUE) * plotHeight;

            return (
              <g key={value}>
                <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 6" />
                <text x={14} y={y + 4} fill="#6b7280" fontSize="12">
                  {formatValue.format(value)}%
                </text>
              </g>
            );
          })}

          {months.map((month, monthIndex) => {
            const centerX = PADDING.left + groupWidth * monthIndex + groupWidth / 2;
            const achievementX = centerX - barWidth - 4;
            const planX = centerX + 4;
            const achievementTotal = achievementsByMonth[monthIndex];
            const planTotal = plansByMonth[monthIndex];

            const renderStackedBar = (barX: number, total: number, metric: "achievement" | "plan") => {
              let accumulated = 0;

              return (
                <g>
                  {series.map((categorySeries) => {
                    const point = categorySeries.points[monthIndex];
                    const value = point[metric];
                    const segmentHeight = (value / maxTotal) * plotHeight;
                    const y = PADDING.top + plotHeight - accumulated - segmentHeight;
                    const fill = metric === "achievement" ? categorySeries.category.color : `${categorySeries.category.color}99`;
                    accumulated += segmentHeight;

                    return (
                      <rect
                        key={`${metric}-${month}-${categorySeries.category.key}`}
                        x={barX}
                        y={y}
                        width={barWidth}
                        height={segmentHeight}
                        rx={0}
                        fill={fill}
                        opacity={metric === "achievement" ? 1 : 0.78}
                        onMouseEnter={(event) => {
                          setTooltip({
                            month,
                            category: categorySeries.category.label,
                            metric: metric === "achievement" ? "달성률" : "계획률",
                            achievement: point.achievement,
                            plan: point.plan,
                            amount: Math.round((point.achievement + point.plan + monthIndex * 3) * 2500000),
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                        onMouseMove={(event) => {
                          setTooltip((current) =>
                            current
                              ? {
                                  ...current,
                                  x: event.clientX,
                                  y: event.clientY,
                                }
                              : current,
                          );
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                  <text
                    x={barX + barWidth / 2}
                    y={PADDING.top + plotHeight - (total / maxTotal) * plotHeight - 8}
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {formatValue.format(total)}%
                  </text>
                </g>
              );
            };

            return (
              <g key={month}>
                {renderStackedBar(achievementX, achievementTotal, "achievement")}
                {renderStackedBar(planX, planTotal, "plan")}
                <text x={centerX} y={CHART_HEIGHT - 10} fill="#64748b" fontSize="12" textAnchor="middle">
                  {month}
                </text>
              </g>
            );
          })}
        </Box>
      </Box>

      {tooltip && tooltipStyle ? (
        <Paper
          elevation={6}
          sx={{
            pointerEvents: "none",
            position: "fixed",
            zIndex: 1300,
            left: tooltipStyle.left,
            top: tooltipStyle.top,
            p: 1.5,
            width: 240,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {tooltip.month} / {tooltip.category}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 0.25 }}>
            {tooltip.metric}
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                달성률
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {tooltip.achievement}%
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                계획률
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {tooltip.plan}%
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                임의 수주액
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {formatCurrency.format(tooltip.amount)}원
              </Typography>
            </Box>
          </Stack>
        </Paper>
      ) : null}
    </Box>
  );
}
